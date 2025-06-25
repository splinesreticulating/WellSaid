import { settings } from '$lib/config'
import { anthropicPrompt } from '$lib/prompts'
import type { Message, ToneType } from '$lib/types'
import { extractReplies, parseSummaryToHumanReadable } from '$lib/utils'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'

const API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-3-opus-20240229'
const DEFAULT_TEMPERATURE = 0.5

const getConfig = () => ({
    model: settings.ANTHROPIC_MODEL || DEFAULT_MODEL,
    temperature: Number(settings.ANTHROPIC_TEMPERATURE || DEFAULT_TEMPERATURE),
    apiKey: settings.ANTHROPIC_API_KEY,
})

export const getAnthropicReply = async (
    messages: Message[],
    tone: ToneType,
    context: string
): Promise<{ summary: string; replies: string[] }> => {
    const config = getConfig()

    if (!config.apiKey) {
        return {
            summary: 'Anthropic API key is not configured.',
            replies: ['Please set up your Anthropic API key in the .env file.'],
        }
    }

    const historyContext = await fetchRelevantHistory(messages)
    const mergedContext = [historyContext, context].filter(Boolean).join('\n')
    const prompt = anthropicPrompt(messages, tone, mergedContext)

    const body = {
        model: config.model,
        max_tokens: 1024,
        temperature: config.temperature,
        messages: [{ role: 'user', content: prompt }],
    }

    logger.debug({ body }, 'Sending request to Anthropic')
    logger.info('Sending request to Anthropic')

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body),
        })

        if (!response.ok) {
            logger.error({ status: response.status }, 'Anthropic API error')
            throw new Error(`Anthropic API error code ${response.status}: ${response.statusText}`)
        }

        const data = (await response.json()) as { content?: Array<{ text?: string }> }
        const rawOutput = data.content?.[0]?.text || ''

        logger.debug({ rawOutput }, 'Anthropic raw response')

        const summary = parseSummaryToHumanReadable(rawOutput)
        const replies = extractReplies(rawOutput)

        logger.debug({ summary, replies }, 'Anthropic parsed response')

        return { summary, replies }
    } catch (error) {
        logger.error({ error }, 'Failed to get Anthropic reply')
        return {
            summary: '',
            replies: ['(AI API error. Check your key and usage.)'],
        }
    }
}
