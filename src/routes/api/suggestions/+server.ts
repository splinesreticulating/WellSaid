import { getSuggestedReplies as khojGetSuggestedReplies } from '$lib/khoj'
import { logger } from '$lib/logger'
import { getSuggestedReplies as openAiGetSuggestedReplies } from '$lib/openAi'
import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { messages, tone, context, model } = await request.json()

        if (!Array.isArray(messages) || !tone) {
            return json({
                error: 'Invalid request format'
            }, { status: 400 })
        }

        const getSuggestedReplies = model === 'khoj' ? khojGetSuggestedReplies : openAiGetSuggestedReplies
        const result = await getSuggestedReplies(
            messages,
            tone,
            context || ''
        )

        return json(result)
    } catch (error) {
        logger.error({ error }, 'Error in generate API')
        return json({
            error: 'Failed to generate suggestions',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
    }
}
