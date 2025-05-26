import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME } from '$env/static/private'
import { logger } from '$lib/logger';
import { type RequestHandler, json } from '@sveltejs/kit'

// 30-day cookie expiration by default
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const POST: RequestHandler = async ({ request, cookies, url }) => {
    try {
        logger.debug('[LOGIN API] Received POST request. URL:', JSON.stringify(url));
        logger.debug('[LOGIN API] Request Headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));

        const { username, password } = await request.json()

        // Validate credentials against environment variables
        if (username === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) {
            // Create authentication cookie (session-based authentication)
            const cookieOptions = {
                path: '/' as const,
                httpOnly: true,
                secure: true,
                sameSite: 'strict' as const,
                maxAge: AUTH_COOKIE_MAX_AGE
            };

            logger.debug('[LOGIN API] Attempting to set auth_token cookie with options:', JSON.stringify(cookieOptions));
            cookies.set('auth_token', 'authenticated', cookieOptions);
            logger.debug('[LOGIN API] Successfully called cookies.set for auth_token.');

            return json({ success: true })
        }

        // Delay response to mitigate timing attacks
        await new Promise(resolve => setTimeout(resolve, 1000))

        return new Response(
            JSON.stringify({ error: 'Invalid username or password' }),
            {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    } catch (error) {
        logger.error('[LOGIN API] Login error:', error);
        // Log the request body if possible, in case of parsing errors

        try {
            const rawBody = await request.text(); // Try to get raw body if json parsing failed
            logger.error('[LOGIN API] Raw request body on error (first 500 chars):', rawBody.substring(0, 500));
        } catch (bodyError) {
            logger.error('[LOGIN API] Could not retrieve raw request body on error:', bodyError);
        }

        return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}
