import { queryMessagesDb } from '$lib/iMessages'
import { getKhojReply } from '$lib/khoj'
import { logger } from '$lib/logger'
import { getOpenaiReply } from '$lib/openAi'
import type { Message, ToneType } from '$lib/types'
import { fail } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'

const DEFAULT_TONE = 'gentle'
const DEFAULT_PROVIDER = 'openai'
const ONE_HOUR = 60 * 60 * 1000

export const load: PageServerLoad = async ({ url }) => {
    const lookBack = Number.parseInt(url.searchParams.get('lookBackHours') || '1')
    const end = new Date()
    const start = new Date(end.getTime() - lookBack * ONE_HOUR)
    const { messages } = await queryMessagesDb(start.toISOString(), end.toISOString())

    return { messages }
}

export const actions: Actions = {
    generate: async ({ request }) => {
        try {
            const formData = await request.formData()
            const messagesString = formData.get('messages') as string
            const tone = formData.get('tone') as ToneType
            const context = formData.get('context') as string
            const provider = formData.get('provider') as string

            if (!messagesString || !tone) {
                return fail(400, { error: 'Invalid request format: Missing messages or tone.' })
            }

            const getReplies = provider === 'khoj' ? getKhojReply : getOpenaiReply

            let messages: Message[]
            try {
                messages = JSON.parse(messagesString) as Message[]
            } catch (err) {
                logger.error({ err, messagesString }, 'Failed to parse messages')
                return fail(400, {
                    error: 'Invalid messages format in FormData: Messages could not be parsed to an array.',
                })
            }

            if (!Array.isArray(messages)) {
                return fail(400, {
                    error: 'Invalid messages format: Expected an array of messages.',
                })
            }

            const result = await getReplies(messages, tone, context || '')
            logger.debug({ resultFromService: result }, 'Result received from AI service in action')

            // Return the result directly - SvelteKit will handle the JSON serialization
            return result
        } catch (err) {
            logger.error({ err }, 'Error generating suggestions')

            return fail(500, {
                error: 'Failed to generate suggestions',
                details: err instanceof Error ? err.message : String(err),
            })
        }
    },
}
