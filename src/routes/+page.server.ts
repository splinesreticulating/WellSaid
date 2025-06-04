import { queryMessagesDb } from '$lib/iMessages'
import { getKhojReply } from '$lib/khoj'
import { logger } from '$lib/logger'
import { getOpenaiReply } from '$lib/openAi'
import type { Message } from '$lib/types'
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
        // Log request details
        logger.debug({
            method: request.method,
            url: request.url,
            headers: Object.fromEntries(request.headers.entries())
        }, 'Received request in action')

        try {
            const contentType = request.headers.get('content-type') || ''

            let context = ''
            let messagesString = ''
            let tone = DEFAULT_TONE
            let provider = DEFAULT_PROVIDER

            const formData = await request.formData()
            const formDataObj = Object.fromEntries(formData.entries())

            messagesString = formData.get('messages') as string
            tone = formData.get('tone') as string || DEFAULT_TONE
            context = formData.get('context') as string || ''
            provider = formData.get('provider') as string || DEFAULT_PROVIDER

            logger.debug({ formData: formDataObj }, 'Received form data in action')

            if (!messagesString || !tone) {
                return fail(400, { error: 'Invalid request format: Missing messages or tone.' })
            }

            const getReplies = provider === 'khoj' ? getKhojReply : getOpenaiReply

            let messages: Message[]
            try {
                messages = JSON.parse(messagesString) as Message[]
            } catch (err) {
                logger.error({ err, messagesString }, 'Failed to parse messages')
                return fail(400, { error: 'Invalid messages format in FormData: Messages could not be parsed to an array.' })
            }

            if (!Array.isArray(messages)) {
                return fail(400, { error: 'Invalid messages format: Expected an array of messages.' })
            }

            const result = await getReplies(messages, tone, context || '')
            logger.debug({ resultFromService: result }, 'Result received from AI service in action')

            // Return the result directly - SvelteKit will handle the JSON serialization
            return result
        } catch (err) {
            logger.error({ err }, 'Error generating suggestions')

            return fail(500, {
                error: 'Failed to generate suggestions',
                details: err instanceof Error ? err.message : String(err)
            })
        }
    }
}
