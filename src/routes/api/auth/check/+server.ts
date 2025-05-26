import { type RequestHandler, json } from '@sveltejs/kit'

export const GET: RequestHandler = async () => {
    return json({ authenticated: true, timestamp: new Date().toISOString() })
}
