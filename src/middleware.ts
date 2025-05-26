import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

// Validate environment variables
if (!BASIC_AUTH_USERNAME || !BASIC_AUTH_PASSWORD) {
    console.error('FATAL: BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set')
    process.exit(1)
}

const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

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

const PUBLIC_PATHS = new Set([
    '/api/auth/check',
    '/api/auth/login',
    '/favicon.ico',
    '/robots.txt',
    '/health'
])

const logSecurityEvent = (event: string, details: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'security',
        event,
        ...details
    }))
}

const authMiddleware: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url
    const clientIP = event.getClientAddress()

    // Skip auth for public paths
    if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_app/') || pathname === '/login') {
        return resolve(event)
    }

    // Check if user is authenticated via cookie
    const authToken = event.cookies.get('auth_token')
    if (authToken === 'authenticated') {
        // User is authenticated - add security headers to response
        const response = await resolve(event)
        
        // Add security headers
        for (const [key, value] of Object.entries(securityHeaders)) {
            response.headers.set(key, value)
        }
        
        return response
    }
    
    // Check rate limiting
    const now = Date.now()
    const attemptInfo = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 }

    // Reset counter if window has passed
    if (now - attemptInfo.lastAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
        loginAttempts.delete(clientIP)
    }
    // Block if too many attempts
    else if (attemptInfo.count >= MAX_LOGIN_ATTEMPTS) {
        logSecurityEvent('rate_limit_exceeded', { ip: clientIP, path: pathname })
        // We still redirect to login page, but with an error parameter
        throw redirect(303, '/login?error=too_many_attempts')
    }

    // Not authenticated - redirect to login page
    logSecurityEvent('auth_required', { ip: clientIP, path: pathname })
    throw redirect(303, '/login')
}

export const handle = sequence(authMiddleware)