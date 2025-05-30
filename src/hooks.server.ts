import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME, JWT_SECRET } from '$env/static/private'
import jwt from 'jsonwebtoken'
import { logger } from '$lib/logger'
import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const PUBLIC_PATHS = new Set([
    '/api/auth/check',
    '/api/auth/login',
    '/favicon.ico',
    '/robots.txt',
    '/health'
])

// Validate environment variables
if (!BASIC_AUTH_USERNAME || !BASIC_AUTH_PASSWORD) {
    logger.error('FATAL: BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set')
    process.exit(1)
}

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>()

const securityHeaders = {
    'Strict-Transport-Security': 'max-age=63072000 includeSubDomains preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1 mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
}

const logSecurityEvent = (event: string, details: Record<string, unknown> = {}) => {
    logger.debug(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'security',
        event,
        ...details
    }))
}

const authMiddleware: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url
    let clientIP: string;
    try {
        clientIP = event.getClientAddress();
    } catch (e: unknown) { 
        logger.warn(`[AUTH] Could not determine clientAddress: ${(e instanceof Error ? e.message : String(e))}. Rate limiting may be less accurate for this request if multiple clients fail IP detection.`);
        // Fallback for rate limiting. In a production environment, you'd want to
        // investigate why getClientAddress is failing or use a more robust solution.
        // For development, using a placeholder allows the app to continue.
        // All requests failing to get an IP will share the same rate limiting bucket.
        clientIP = 'unknown_client_address_fallback';
    }
    const cookies = event.request.headers.get('cookie') || ''

    logger.debug('[AUTH] Incoming request:', { pathname, clientIP, cookies })

    // Skip auth for public paths
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth/') ||
        pathname.startsWith('/_app/') ||
        PUBLIC_PATHS.has(pathname)
    ) {
        logger.debug('[AUTH] Allowed public path:', pathname)

        return resolve(event)
    }

    // Check if user is authenticated via JWT
    const token = event.cookies.get('auth_token');
    let isAuthenticated = false;

    if (!JWT_SECRET) {
        logger.error('[AUTH] JWT_SECRET is not defined. Cannot verify JWTs in middleware. Denying access.');
        // This is a server configuration error, but we still redirect to login to prevent access.
    } else if (token) {
        try {
            jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
            isAuthenticated = true;
            logger.debug('[AUTH] JWT verification successful in middleware for path:', pathname);
        } catch (error: unknown) {
            let reason = 'Invalid token';
            let errorName = 'UnknownError';
            if (error instanceof Error) {
                errorName = error.name;
                if (error.name === 'TokenExpiredError') {
                    reason = 'Token expired';
                } else if (error.name === 'JsonWebTokenError') {
                    reason = 'Token malformed or signature invalid';
                }
            }
            logger.warn(`[AUTH] JWT verification failed in middleware: ${errorName} - ${reason} for path: ${pathname}`);
            logSecurityEvent('jwt_verification_failed_middleware', { ip: clientIP, path: pathname, reason, errorName });
            // Clear the invalid/expired cookie to prevent redirect loops or issues
            event.cookies.delete('auth_token', { path: '/' }); 
        }
    } else {
        logger.debug('[AUTH] No auth_token cookie found in middleware for path:', pathname);
    }

    if (isAuthenticated) {
        // User is authenticated - add security headers to response
        const response = await resolve(event);
        for (const [key, value] of Object.entries(securityHeaders)) {
            response.headers.set(key, value);
        }
        logger.debug('[AUTH] Authenticated via JWT, returning response for path:', pathname);
        return response;
    }

    // Check rate limiting
    const attemptInfo = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 }

    // Reset counter if window has passed
    if (Date.now() - attemptInfo.lastAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
        loginAttempts.delete(clientIP)
    }
    // Block if too many attempts
    else if (attemptInfo.count >= MAX_LOGIN_ATTEMPTS) {
        logSecurityEvent('rate_limit_exceeded', { ip: clientIP, path: pathname })

        logger.debug('[AUTH] Too many attempts for IP:', clientIP)

        // We still redirect to login page, but with an error parameter
        throw redirect(303, '/login?error=too_many_attempts')
    }

    // Not authenticated - redirect to login page
    logSecurityEvent('auth_required', { ip: clientIP, path: pathname })
    logger.debug('[AUTH] Not authenticated, redirecting to /login for', pathname)

    throw redirect(303, '/login')
}

export const handle = sequence(authMiddleware)
