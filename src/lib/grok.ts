import { settings } from '$lib/config'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'
import { openAiPrompt, systemContext } from './prompts'
import type { Message, ToneType } from './types'
import { extractReplies, formatMessagesAsText, parseSummaryToHumanReadable } from './utils'

const API_URL = 'https://grok.x.ai/api/chat/completions'
const DEFAULT_MODEL = 'grok-1'
const DEFAULT_TEMPERATURE = 0.5

const getConfig = () => ({
    model: settings.GROK_MODEL || DEFAULT_MODEL,
    temperature: Number(settings.GROK_TEMPERATURE || DEFAULT_TEMPERATURE),
    apiKey: settings.GROK_API_KEY,
})

export const getGrokReply = async (
    messages: Message[],
    tone: ToneType,
    context: string
): Promise<{ summary: string; replies: string[] }> => {
    const config = getConfig()
    if (!config.apiKey) {
        return {
            summary: 'Grok API key is not configured.',
            replies: ['Please set up your Grok API key in the .env file.'],
        }
    }

    const historyContext = await fetchRelevantHistory(messages)
    const prompt = openAiPrompt(tone, historyContext) + '\n\n' + context

    const body = {
        model: config.model,
        messages: [
            { role: 'system', content: systemContext() },
            { role: 'user', content: formatMessagesAsText(messages) },
            { role: 'user', content: prompt },
        ],
        temperature: config.temperature,
        response_format: { type: 'text' },
    }

    logger.debug({ body }, 'Sending request to Grok')
    logger.info('Sending request to Grok')

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            logger.error({ status: response.status }, 'Grok API error')
            throw new Error(`Grok API error code ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const rawOutput = data.choices[0]?.message?.content || ''

        if (!rawOutput) {
            throw new Error('Empty response from Grok')
        }

        const summary = parseSummaryToHumanReadable(rawOutput)
        const replies = extractReplies(rawOutput)

        if (!summary || !replies.length) {
            logger.error({ rawOutput }, 'Failed to parse response from Grok')
            throw new Error('Invalid response format from Grok')
        }

        return { summary, replies }
    } catch (error) {
        logger.error({ error }, 'Failed to get Grok reply')
        return {
            summary: '',
            replies: ['(AI API error. Check your key and usage.)'],
        }
    }
}
