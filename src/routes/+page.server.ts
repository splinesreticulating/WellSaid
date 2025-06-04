import { queryMessagesDb } from '$lib/iMessages';
import { getOpenaiReply } from '$lib/openAi';
import { getKhojReply } from '$lib/khoj';
import { logger } from '$lib/logger';
import type { Actions, PageServerLoad } from './$types';
import type { Message } from '$lib/types';
import { json } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
    const lookBack = Number.parseInt(url.searchParams.get('lookBackHours') || '1');
    const end = new Date();
    const start = new Date(end.getTime() - lookBack * 60 * 60 * 1000);
    const { messages } = await queryMessagesDb(start.toISOString(), end.toISOString());
    return { messages };
};

export const actions: Actions = {
    generate: async ({ request }) => {
        try {
            const { messages, tone, context, provider } = await request.json();
            if (!Array.isArray(messages) || !tone) {
                return json({ error: 'Invalid request format' }, { status: 400 });
            }
            const getReplies = provider === 'khoj' ? getKhojReply : getOpenaiReply;
            const result = await getReplies(messages as Message[], tone as string, context || '');
            return json(result);
        } catch (err) {
            logger.error({ err }, 'Error generating suggestions');
            return json({
                error: 'Failed to generate suggestions',
                details: err instanceof Error ? err.message : String(err)
            }, { status: 500 });
        }
    }
};
