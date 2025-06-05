import { JWT_SECRET } from '$env/static/private'
import { type RequestHandler, json } from '@sveltejs/kit'
import jwt from 'jsonwebtoken'
import { logger } from '$lib/logger'

export const GET: RequestHandler = async ({ cookies }) => {
    if (!JWT_SECRET) {
        logger.error('JWT_SECRET is not defined. Cannot verify JWTs.')
        return new Response(
            JSON.stringify({ authenticated: false, error: 'Server configuration error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            },
        )
    }

    const token = cookies.get('auth_token')

    if (!token) {
        return json(
            {
                authenticated: false,
                timestamp: new Date().toISOString(),
                reason: 'No token provided',
            },
            { status: 401 },
        )
    }

    try {
        jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
        // If verification is successful, token is valid and not expired
        return json({
            authenticated: true,
            timestamp: new Date().toISOString(),
        })
    } catch (err) {
        let reason = 'Invalid token'
        let errorMessage = 'Unknown error during JWT verification'
        let errorName = 'UnknownError'

        if (err instanceof Error) {
            errorMessage = err.message
            errorName = err.name
            if (err.name === 'TokenExpiredError') {
                reason = 'Token expired'
            } else if (err.name === 'JsonWebTokenError') {
                // This catches other jwt errors like malformed token, invalid signature
                reason = 'Token malformed or signature invalid'
            } else {
                // Non-JWT specific error, could be something else
                reason = 'Token verification failed due to an unexpected error'
            }
        } else if (typeof err === 'string') {
            errorMessage = err
        }

        logger.warn(`JWT verification failed: ${errorName} - ${errorMessage}`)
        return json(
            { authenticated: false, timestamp: new Date().toISOString(), reason },
            { status: 401 },
        )
    }
}
