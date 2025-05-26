import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME } from '$env/static/private'
import { type RequestHandler, json } from '@sveltejs/kit'

// 30-day cookie expiration by default
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const POST: RequestHandler = async ({ request, cookies, url }) => { // Added url for logging
    try {
        console.log('[LOGIN API] Received POST request. URL:', JSON.stringify(url));
        console.log('[LOGIN API] Request Headers:', JSON.stringify(Object.fromEntries(request.headers.entries())));
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
            console.log('[LOGIN API] Attempting to set auth_token cookie with options:', JSON.stringify(cookieOptions));
            cookies.set('auth_token', 'authenticated', cookieOptions);
            console.log('[LOGIN API] Successfully called cookies.set for auth_token.');

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
        console.error('[LOGIN API] Login error:', error);
        // Log the request body if possible, in case of parsing errors
        try {
            const rawBody = await request.text(); // Try to get raw body if json parsing failed
            console.error('[LOGIN API] Raw request body on error (first 500 chars):', rawBody.substring(0, 500));
        } catch (bodyError) {
            console.error('[LOGIN API] Could not retrieve raw request body on error:', bodyError);
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
