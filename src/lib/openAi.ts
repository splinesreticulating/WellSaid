import {
    OPENAI_API_KEY,
    OPENAI_FREQUENCY_PENALTY,
    OPENAI_MODEL,
    OPENAI_PRESENCE_PENALTY,
    OPENAI_TEMPERATURE,
    OPENAI_TOP_P,
} from '$env/static/private'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'
import { PERMANENT_CONTEXT, buildReplyPrompt } from './prompt'
import type { Message, OpenAIConfig, ToneType } from './types'
import { formatAsUserAndAssistant } from './utils'

const API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4'
const DEFAULT_TEMPERATURE = 0.5

const getConfig = (): OpenAIConfig => ({
    model: OPENAI_MODEL || DEFAULT_MODEL,
    temperature: Number(OPENAI_TEMPERATURE || DEFAULT_TEMPERATURE),
    topP: OPENAI_TOP_P ? Number(OPENAI_TOP_P) : undefined,
    frequencyPenalty: OPENAI_FREQUENCY_PENALTY ? Number(OPENAI_FREQUENCY_PENALTY) : undefined,
    presencePenalty: OPENAI_PRESENCE_PENALTY ? Number(OPENAI_PRESENCE_PENALTY) : undefined,
    apiUrl: API_URL,
    apiKey: OPENAI_API_KEY,
})

if (!OPENAI_API_KEY) {
    logger.warn('⚠️ OPENAI_API_KEY is not set. OpenAI integration will not work.')
}

const summaryFunction = {
    type: 'function',
    function: {
        name: 'draft_replies',
        description:
            'Generate a short summary and three suggested replies (short, medium, and long)',
        parameters: {
            type: 'object',
            properties: {
                summary: {
                    type: 'string',
                    description: 'Brief summary of the conversation',
                },
                replies: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Suggested replies for the user',
                },
            },
            required: ['summary', 'replies'],
        },
    },
}

export const getOpenaiReply = async (
    messages: Message[],
    tone: ToneType,
    context: string,
): Promise<{ summary: string; replies: string[] }> => {
    const config = getConfig()

    if (!config.apiKey) {
        return {
            summary: 'OpenAI API key is not configured.',
            replies: ['Please set up your OpenAI API key in the .env file.'],
        }
    }

    const conversation = formatAsUserAndAssistant(messages)
    const historyContext = await fetchRelevantHistory(messages)
    const prompt = buildReplyPrompt(tone, [historyContext, context].filter(Boolean).join('\n'))

    logger.debug({ prompt }, 'Sending prompt to OpenAI')

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: PERMANENT_CONTEXT },
                    ...conversation,
                    { role: 'user', content: prompt },
                ],
                temperature: config.temperature,
                ...(config.topP && { top_p: config.topP }),
                ...(config.frequencyPenalty && { frequency_penalty: config.frequencyPenalty }),
                ...(config.presencePenalty && { presence_penalty: config.presencePenalty }),
                tools: [summaryFunction],
                tool_choice: { type: 'function', function: { name: 'draft_replies' } },
            }),
        })

        if (!response.ok) {
            logger.error({ status: response.status }, 'OpenAI API error')
            throw new Error(`OpenAI API error: ${response.status}`)
        }

        logger.debug(
            { status: response.status, statusText: response.statusText },
            'OpenAI API response received',
        )

        const { choices } = await response.json()
        const functionCall = choices[0]?.message?.tool_calls?.[0]?.function

        if (!functionCall) throw new Error('No function call in response')

        const { summary, replies } = JSON.parse(functionCall.arguments)

        if (!summary || !Array.isArray(replies)) {
            logger.error({ summary, replies }, 'Invalid response format from OpenAI')
            throw new Error('Invalid response format from OpenAI')
        }

        return { summary, replies }
    } catch (error) {
        logger.error({ error }, 'Error in getOpenaiReply (fetching or parsing OpenAI response)')
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)'],
        }
    }
}
