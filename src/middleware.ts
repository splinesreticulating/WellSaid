import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME } from '$env/static/private';
import type { Handle } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import auth from 'basic-auth';

// Validate environment variables
if (!BASIC_AUTH_USERNAME || !BASIC_AUTH_PASSWORD) {
    console.error('FATAL: BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set');
    process.exit(1);
}

const REALM = 'WellSaid';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

const securityHeaders = {
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

const PUBLIC_PATHS = new Set([
    '/api/auth/check',
    '/favicon.ico',
    '/robots.txt',
    '/health'
]);

const logSecurityEvent = (event: string, details: Record<string, unknown> = {}) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'security',
        event,
        ...details
    }));
};

const basicAuth: Handle = async ({ event, resolve }) => {
    const { pathname } = event.url;
    const clientIP = event.getClientAddress();

    // Skip auth for public paths
    if (PUBLIC_PATHS.has(pathname) || pathname.startsWith('/_app/')) {
        return resolve(event);
    }

    // Check rate limiting
    const now = Date.now();
    const attemptInfo = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };

    // Reset counter if window has passed
    if (now - attemptInfo.lastAttempt > LOGIN_ATTEMPT_WINDOW_MS) {
        loginAttempts.delete(clientIP);
    }
    // Block if too many attempts
    else if (attemptInfo.count >= MAX_LOGIN_ATTEMPTS) {
        logSecurityEvent('rate_limit_exceeded', { ip: clientIP, path: pathname });
        throw error(429, 'Too many login attempts. Please try again later.');
    }

    // Check credentials
    const authHeader = event.request.headers.get('authorization');
    if (authHeader) {
        const credentials = auth.parse(authHeader);

        if (credentials &&
            credentials.name === BASIC_AUTH_USERNAME &&
            credentials.pass === BASIC_AUTH_PASSWORD) {

            // Reset attempt counter on successful login
            loginAttempts.delete(clientIP);

            const response = await resolve(event);

            // Add security headers
            for (const [key, value] of Object.entries(securityHeaders)) {
                response.headers.set(key, value);
            }

            return response;
        }
        
        // Increment failed attempt counter
        const attempts = (loginAttempts.get(clientIP)?.count || 0) + 1;
        loginAttempts.set(clientIP, { count: attempts, lastAttempt: now });

        logSecurityEvent('login_failed', {
            ip: clientIP,
            attempt: attempts,
            maxAttempts: MAX_LOGIN_ATTEMPTS
        });
    }

    // Return 401 Unauthorized if no/invalid credentials
    logSecurityEvent('auth_required', { ip: clientIP, path: pathname });
    return new Response('Authentication required', {
        status: 401,
        headers: {
            'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            ...securityHeaders
        }
    });
};

export const handle = sequence(basicAuth);