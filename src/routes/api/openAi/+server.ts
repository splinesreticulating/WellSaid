import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getSuggestedReplies } from '$lib/ai'
import { logger } from '$lib/logger'

export const POST: RequestHandler = async ({ request }) => {
    try {
        const { messages, tone, context } = await request.json()

        if (!Array.isArray(messages) || !tone) {
            return json({
                error: 'Invalid request format'
            }, { status: 400 })
        }

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
