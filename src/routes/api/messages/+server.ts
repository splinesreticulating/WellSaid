import { queryMessagesDb } from '$lib/iMessages'
import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = async ({ url }) => {
    const start = url.searchParams.get('start')
    const end = url.searchParams.get('end')

    if (!start || !end) {
        return new Response(JSON.stringify({ error: 'Missing start or end' }), { status: 400 })
    }

    const { messages } = await queryMessagesDb(start, end)

    return new Response(JSON.stringify({ messages }), {
        headers: { 'Content-Type': 'application/json' }
    })
}
