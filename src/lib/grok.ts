import {
    GROK_API_KEY,
    GROK_MODEL,
    GROK_TEMPERATURE,
    GROK_TRENDS_URL,
    GROK_BEARER_TOKEN,
} from '$env/static/private'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'
import { openAiPrompt, systemContext } from './prompts'
import type { Message, ToneType } from './types'
import { formatMessagesAsText } from './utils'

const API_URL = 'https://grok.x.ai/api/chat/completions'
const DEFAULT_MODEL = 'grok-1'
const DEFAULT_TEMPERATURE = 0.5

const getConfig = () => ({
    model: GROK_MODEL || DEFAULT_MODEL,
    temperature: Number(GROK_TEMPERATURE || DEFAULT_TEMPERATURE),
    apiKey: GROK_API_KEY,
})

const fetchTrends = async (): Promise<string> => {
    if (!GROK_TRENDS_URL || !GROK_BEARER_TOKEN) return ''
    try {
        const res = await fetch(GROK_TRENDS_URL, {
            headers: { Authorization: `Bearer ${GROK_BEARER_TOKEN}` },
        })
        if (!res.ok) {
            logger.warn({ status: res.status }, 'Failed to fetch trends')
            return ''
        }
        const data = (await res.json()) as { trends?: Array<{ name: string }> }
        return data.trends && data.trends.length
            ? `Trending topics: ${data.trends.map((t) => t.name).join(', ')}`
            : ''
    } catch (err) {
        logger.error({ err }, 'Error fetching trends')
        return ''
    }
}

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
    const trends = await fetchTrends()
    const prompt = openAiPrompt(tone, historyContext) + '\n\n' + context
    const trendContext = trends ? `\n\n${trends}` : ''

    const body = {
        model: config.model,
        messages: [
            { role: 'system', content: systemContext + trendContext },
            { role: 'user', content: formatMessagesAsText(messages) },
            { role: 'user', content: prompt },
        ],
        temperature: config.temperature,
        tools: [
            {
                type: 'function',
                function: {
                    name: 'draft_replies',
                    description: 'Generate a short summary and three suggested replies',
                    parameters: {
                        type: 'object',
                        properties: {
                            summary: { type: 'string' },
                            replies: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['summary', 'replies'],
                    },
                },
            },
        ],
        tool_choice: { type: 'function', function: { name: 'draft_replies' } },
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

        const { choices } = await response.json()
        const functionCall = choices[0]?.message?.tool_calls?.[0]?.function
        if (!functionCall) throw new Error('No function call in response')
        const { summary, replies } = JSON.parse(functionCall.arguments)

        if (!summary || !Array.isArray(replies)) {
            logger.error({ summary, replies }, 'Invalid response format from Grok')
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
