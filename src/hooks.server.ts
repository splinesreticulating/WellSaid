import { JWT_SECRET } from '$env/static/private'
import { logger } from '$lib/logger'
import { redirect } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import type { Handle } from '@sveltejs/kit'

const publicPaths = ['/login']

export const handle: Handle = async ({ event, resolve }) => {
    const { url, cookies } = event

    // Skip authentication check for public paths
    if (publicPaths.includes(url.pathname)) {
        return resolve(event)
    }

    // Check if user is authenticated
    if (!JWT_SECRET) {
        logger.error('JWT_SECRET is not defined. Cannot verify JWTs.')
        throw redirect(303, '/login')
    }

    const token = cookies.get('auth_token')

    if (!token) {
        logger.info(`Redirecting unauthenticated user from ${url.pathname} to /login`)
        throw redirect(303, '/login')
    }

    try {
        jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
        // Token is valid, continue with the request
        logger.debug(`Authenticated user accessing ${url.pathname}`)
        return resolve(event)
    } catch (err) {
        logger.warn(
            `JWT verification failed for ${url.pathname}: ${err instanceof Error ? err.message : 'Unknown error'}`
        )
        // Clear invalid token
        cookies.delete('auth_token', { path: '/' })
        throw redirect(303, '/login')
    }
}
