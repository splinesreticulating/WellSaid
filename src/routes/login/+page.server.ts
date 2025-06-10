import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME, JWT_SECRET } from '$env/static/private'
import { logger } from '$lib/logger'
import { safeCompare } from '$lib/utils'
import { type Actions, fail, redirect } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

// Most cookies go bad after 30 days so
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const actions: Actions = {
    default: async ({ request, cookies }) => {
        if (!JWT_SECRET) {
            logger.error('[LOGIN ACTION] JWT_SECRET is not defined. Cannot create JWTs.')
            return fail(500, { error: 'Server configuration error' })
        }

        try {
            const data = await request.formData()
            const username = data.get('username')?.toString()
            const password = data.get('password')?.toString()

            logger.debug(`[LOGIN ACTION] Processing login attempt for username: ${username}`)

            if (!username || !password) {
                return fail(400, { error: 'Username and password are required' })
            }

            // Validate credentials
            if (
                safeCompare(username, BASIC_AUTH_USERNAME) &&
                safeCompare(password, BASIC_AUTH_PASSWORD)
            ) {
                // Create authentication cookie (session-based authentication)
                const cookieOptions = {
                    path: '/' as const,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict' as const,
                    maxAge: AUTH_COOKIE_MAX_AGE,
                }

                // Create JWT token
                const expiresIn = AUTH_COOKIE_MAX_AGE // seconds

                const tokenPayload = {
                    sub: username, // Subject (standard claim for user ID)
                    iat: Math.floor(Date.now() / 1000), // Issued at (standard claim)
                    exp: Math.floor(Date.now() / 1000) + expiresIn, // Expiration time (standard claim)
                }

                const token = jwt.sign(tokenPayload, JWT_SECRET, { algorithm: 'HS256' })

                logger.debug('[LOGIN ACTION] Setting auth_token cookie with JWT')
                cookies.set('auth_token', token, cookieOptions)
                logger.debug('[LOGIN ACTION] Successfully set auth_token cookie')

                // Redirect to home page on successful login
                throw redirect(303, '/')
            }

            // Delay response to mitigate timing attacks
            await new Promise((resolve) => setTimeout(resolve, 1000))

            return fail(401, { error: 'nope' })
        } catch (error) {
            // Debug what type of error we're getting
            logger.debug(
                `[LOGIN ACTION] Caught error type: ${typeof error}, instanceof Response: ${error instanceof Response}, instanceof Error: ${error instanceof Error}`
            )
            if (error && typeof error === 'object') {
                logger.debug(`[LOGIN ACTION] Error constructor: ${error.constructor.name}`)
                if ('status' in error) {
                    logger.debug(
                        `[LOGIN ACTION] Error status: ${(error as { status: number }).status}`
                    )
                }
            }

            // Check if this is a SvelteKit redirect (constructor name is 'Redirect')
            const isRedirect =
                error && typeof error === 'object' && error.constructor.name === 'Redirect'

            // Only log actual errors, not redirects
            if (!isRedirect) {
                logger.error(
                    `[LOGIN ACTION] Login error: ${error instanceof Error ? error.message : 'Unknown error'}`
                )
                return fail(500, { error: 'An unexpected error occurred' })
            }

            // Re-throw redirects
            logger.debug('[LOGIN ACTION] Re-throwing redirect')
            throw error
        }
    },
}
