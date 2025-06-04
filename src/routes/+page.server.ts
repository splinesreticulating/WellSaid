import { queryMessagesDb } from '$lib/iMessages'
import { getKhojReply } from '$lib/khoj'
import { logger } from '$lib/logger'
import { getOpenaiReply } from '$lib/openAi'
import type { Message } from '$lib/types'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ url }) => {
    const lookBack = Number.parseInt(url.searchParams.get('lookBackHours') || '1')
    const end = new Date()
    const start = new Date(end.getTime() - lookBack * 60 * 60 * 1000)

    const { messages } = await queryMessagesDb(start.toISOString(), end.toISOString())
    return { messages }
}

export const actions: Actions = {
    generate: async ({ request }) => {
        try {
            const formData = await request.formData()
            const messagesString = formData.get('messages') as string | null
            const tone = formData.get('tone') as string | null
            const context = formData.get('context') as string | null
            const provider = formData.get('provider') as string | null

            if (!messagesString || !tone) {
                return fail(400, { error: 'Invalid request format: Missing messages or tone.' })
            }

            const getReplies = provider === 'khoj' ? getKhojReply : getOpenaiReply
            const messages = JSON.parse(messagesString) as Message[]

            if (!Array.isArray(messages)) {
                return fail(400, { error: 'Invalid messages format in FormData: Messages could not be parsed to an array.' })
            }

            const result = await getReplies(messages, tone, context || '')
            logger.debug({ resultFromService: result }, 'Result received from AI service in action')

            return result // Return plain object
        } catch (err) {
            logger.error({ err }, 'Error generating suggestions')

            return fail(500, {
                error: 'Failed to generate suggestions',
                details: err instanceof Error ? err.message : String(err)
            })
        }
    }
}
