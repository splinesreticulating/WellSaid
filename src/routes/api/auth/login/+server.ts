import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME, JWT_SECRET } from '$env/static/private'
import { logger } from '$lib/logger'
import { safeCompare } from '$lib/utils'
import { type RequestHandler, json } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

// 30-day cookie expiration by default
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const POST: RequestHandler = async ({ request, cookies, url }) => {
    if (!JWT_SECRET) {
        logger.error('JWT_SECRET is not defined. Cannot issue JWTs.')
        return new Response(JSON.stringify({ error: 'Server configuration error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
    try {
        logger.debug('[LOGIN API] Received POST request. URL:', JSON.stringify(url))
        logger.debug(
            '[LOGIN API] Request Headers:',
            JSON.stringify(Object.fromEntries(request.headers.entries())),
        )

        const { username, password } = await request.json()

        // Validate credentials against environment variables using constant-time comparison
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

            // Create JWT
            const expiresIn = AUTH_COOKIE_MAX_AGE // seconds
            const tokenPayload = {
                // For basic auth, user identifier is static or not strictly necessary in payload
                // You could add a role or a generic 'userId: 'basic_auth_user'' if needed
                sub: username, // Subject (standard claim for user ID)
                iat: Math.floor(Date.now() / 1000), // Issued at (standard claim)
                exp: Math.floor(Date.now() / 1000) + expiresIn, // Expiration time (standard claim)
            }

            const token = jwt.sign(tokenPayload, JWT_SECRET, { algorithm: 'HS256' })

            logger.debug(
                '[LOGIN API] Attempting to set auth_token cookie with JWT and options:',
                JSON.stringify(cookieOptions),
            )
            cookies.set('auth_token', token, cookieOptions)
            logger.debug('[LOGIN API] Successfully called cookies.set for auth_token with JWT.')

            return json({ success: true })
        }

        // Delay response to mitigate timing attacks
        await new Promise((resolve) => setTimeout(resolve, 1000))

        return new Response(JSON.stringify({ error: 'nope' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        logger.error('[LOGIN API] Login error:', error)
        // Log the request body if possible, in case of parsing errors

        try {
            const rawBody = await request.text() // Try to get raw body if json parsing failed
            logger.error(
                '[LOGIN API] Raw request body on error (first 500 chars):',
                rawBody.substring(0, 500),
            )
        } catch (bodyError) {
            logger.error('[LOGIN API] Could not retrieve raw request body on error:', bodyError)
        }

        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
}
