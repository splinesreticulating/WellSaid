import type { RequestHandler } from '@sveltejs/kit';
import { getMessages } from '$lib/getMessages';

export const GET: RequestHandler = async ({ url }) => {
    const start = url.searchParams.get('start');
    const end = url.searchParams.get('end');
    if (!start || !end) {
        return new Response(JSON.stringify({ error: 'Missing start or end' }), { status: 400 });
    }
    // getMessages should be exported from +page.server.ts
    const messages = await getMessages(start, end);
    return new Response(JSON.stringify({ messages }), {
        headers: { 'Content-Type': 'application/json' }
    });
};
