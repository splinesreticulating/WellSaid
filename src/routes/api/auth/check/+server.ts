import { type RequestHandler, json } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ cookies }) => {
    const authToken = cookies.get('auth_token')
    
    if (authToken === 'authenticated') {
        return json({ 
            authenticated: true, 
            timestamp: new Date().toISOString() 
        })
    }
    
    return new Response(
        JSON.stringify({ 
            authenticated: false, 
            timestamp: new Date().toISOString() 
        }), 
        { 
            status: 401,
            headers: { 'Content-Type': 'application/json' }
        }
    )
}
