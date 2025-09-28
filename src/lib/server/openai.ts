import { settings } from '$lib/config'
import { logger } from '$lib/logger'
import OpenAI from 'openai'

let client: OpenAI | null = null

export const getOpenAIClient = (): OpenAI | null => {
    if (client) {
        return client
    }

    if (!settings.OPENAI_API_KEY) {
        logger.warn('OpenAI API key missing; semantic recall disabled')
        return null
    }

    client = new OpenAI({ apiKey: settings.OPENAI_API_KEY })
    return client
}
