import {
    BASIC_AUTH_PASSWORD,
    BASIC_AUTH_USERNAME,
    JWT_SECRET,
} from '$env/static/private'
import { logger } from '$lib/logger'
import type { Actions } from './$types'
import { fail, redirect } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'

const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const actions: Actions = {
    default: async ({ request, cookies, url }) => {
        if (!JWT_SECRET) {
            logger.error('JWT_SECRET is not defined. Cannot issue JWTs.')
            return fail(500, { error: 'Server configuration error' })
        }
        try {
            logger.debug(
                '[LOGIN PAGE] Received POST request. URL:',
                JSON.stringify(url),
            )
            const formData = await request.formData()
            const username = formData.get('username')
            const password = formData.get('password')

            if (
                username === BASIC_AUTH_USERNAME &&
                password === BASIC_AUTH_PASSWORD
            ) {
                const cookieOptions = {
                    path: '/' as const,
                    httpOnly: true,
                    secure: true,
                    sameSite: 'strict' as const,
                    maxAge: AUTH_COOKIE_MAX_AGE,
                }
                const expiresIn = AUTH_COOKIE_MAX_AGE
                const tokenPayload = {
                    sub: username,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + expiresIn,
                }
                const token = jwt.sign(tokenPayload, JWT_SECRET, {
                    algorithm: 'HS256',
                })
                cookies.set('auth_token', token, cookieOptions)
                throw redirect(302, '/')
            }

            await new Promise((resolve) => setTimeout(resolve, 1000))
            return fail(401, { error: 'Invalid username or password' })
        } catch (error) {
            logger.error('[LOGIN PAGE] Login error:', error)
            return fail(500, { error: 'Internal server error' })
        }
    },
}
