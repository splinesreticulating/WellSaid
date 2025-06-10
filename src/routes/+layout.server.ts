import { JWT_SECRET } from '$env/static/private'
import { logger } from '$lib/logger'
import jwt from 'jsonwebtoken'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ cookies }) => {
    if (!JWT_SECRET) {
        logger.error('JWT_SECRET is not defined. Cannot verify JWTs.')

        return { authenticated: false }
    }

    const token = cookies.get('auth_token')

    if (!token) {
        return { authenticated: false }
    }

    try {
        jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })

        return { authenticated: true }
    } catch (err) {
        logger.warn(
            `JWT verification failed in layout: ${err instanceof Error ? err.message : 'Unknown error'}`
        )

        return { authenticated: false }
    }
}
