import { BASIC_AUTH_PASSWORD, BASIC_AUTH_USERNAME } from '$env/static/private'
import { type RequestHandler, json } from '@sveltejs/kit'

// 30-day cookie expiration by default
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const POST: RequestHandler = async ({ request, cookies }) => {
    try {
        const { username, password } = await request.json()
        
        // Validate credentials against environment variables
        if (username === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) {
            // Create authentication cookie (session-based authentication)
            cookies.set('auth_token', 'authenticated', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: AUTH_COOKIE_MAX_AGE
            })
            
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
        console.error('Login error:', error)
        return new Response(
            JSON.stringify({ error: 'Internal server error' }), 
            { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
}
