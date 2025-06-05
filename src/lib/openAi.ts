import {
    OPENAI_API_KEY, OPENAI_FREQUENCY_PENALTY, OPENAI_MODEL, OPENAI_PRESENCE_PENALTY, OPENAI_TEMPERATURE, OPENAI_TOP_P,
} from '$env/static/private'
import { logger } from './logger'
import { PERMANENT_CONTEXT, buildReplyPrompt } from './prompts'
import type { Message } from './types'
import { formatMessages } from './utils'

const openaiModel = OPENAI_MODEL || 'gpt-4'
const openaiTemperature = Number.parseFloat(OPENAI_TEMPERATURE || '0.5')
const openaiTopP = OPENAI_TOP_P ? Number.parseFloat(OPENAI_TOP_P) : undefined
const openaiFrequencyPenalty = OPENAI_FREQUENCY_PENALTY
    ? Number.parseFloat(OPENAI_FREQUENCY_PENALTY)
    : undefined
const openaiPresencePenalty = OPENAI_PRESENCE_PENALTY
    ? Number.parseFloat(OPENAI_PRESENCE_PENALTY)
    : undefined
const openaiApiUrl = 'https://api.openai.com/v1/chat/completions'

const summaryFunction = {
    type: 'function',
    function: {
        name: 'draft_replies',
        description: 'Generate a short summary and three suggested replies',
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
} as const

if (!OPENAI_API_KEY)
    logger.warn('⚠️ OPENAI_API_KEY is not set. OpenAI integration will not work.')

export const getOpenaiReply = async (
    messages: Message[],
    tone: string,
    context: string,
): Promise<{ summary: string; replies: string[] }> => {
    if (!OPENAI_API_KEY)
        return {
            summary: 'OpenAI API key is not configured.',
            replies: ['Please set up your OpenAI API key in the .env file.'],
        }

    const conversation = formatMessages(messages)
    const prompt = buildReplyPrompt(conversation, tone, context)

    logger.debug({ prompt }, 'Sending prompt to OpenAI')

    try {
        const response = await fetch(openaiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: openaiModel,
                messages: [
                    { role: 'system', content: PERMANENT_CONTEXT },
                    { role: 'user', content: prompt },
                ],
                temperature: openaiTemperature,
                ...(openaiTopP ? { top_p: openaiTopP } : {}),
                ...(openaiFrequencyPenalty ? { frequency_penalty: openaiFrequencyPenalty } : {}),
                ...(openaiPresencePenalty ? { presence_penalty: openaiPresencePenalty } : {}),
                tools: [summaryFunction],
                tool_choice: {
                    type: 'function',
                    function: { name: summaryFunction.function.name },
                },
            }),
        })

        if (!response.ok) {
            logger.error({ status: response.status }, 'OpenAI API error')
            throw new Error(`OpenAI API error: ${response.status}`)
        }

        logger.debug(
            { status: response.status, statusText: response.statusText },
            'OpenAI API response status',
        )
        const data = await response.json()
        logger.debug({ data }, 'OpenAI API raw data')

        const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{}'
        logger.debug({ args }, 'OpenAI API function arguments')

        let summary = ''
        let replies: string[] = []
        try {
            const parsed = JSON.parse(args) as {
                summary?: string
                replies?: string[]
            }

            summary = parsed.summary || ''
            replies = parsed.replies || []
        } catch (parseErr) {
            logger.error(
                { parseErr, args },
                'Failed to parse OpenAI function response',
            )
        }

        logger.debug({ summary, replies }, 'Parsed summary and replies from OpenAI')

        return { summary, replies }
    } catch (err) {
        logger.error({ err }, 'Error in getOpenaiReply (fetching or parsing OpenAI response)')
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)'],
        }
    }
}
