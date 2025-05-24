import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type { Message } from '$lib/types';
import { getSuggestedReplies } from '$lib/ai';

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { messages, tone, context } = await request.json();
        
        // Validate input
        if (!Array.isArray(messages) || !tone) {
            return json({ 
                error: 'Invalid request format' 
            }, { status: 400 });
        }
        
        const result = await getSuggestedReplies(
            messages,
            tone,
            context || ''
        );
        
        return json(result);
    } catch (error) {
        console.error('Error in generate API:', error);
        return json({ 
            error: 'Failed to generate suggestions',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
};
