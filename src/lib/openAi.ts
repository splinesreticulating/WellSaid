import { settings } from '$lib/config'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'
import { openAiPrompt, systemContext } from './prompts'
import type { Message, OpenAIConfig, ToneType } from './types'
import { extractReplies, formatMessagesAsText, parseSummaryToHumanReadable } from './utils'

const API_URL = 'https://api.openai.com/v1/chat/completions'
const DEFAULT_MODEL = 'gpt-4'
const DEFAULT_TEMPERATURE = 0.5

const getConfig = (): OpenAIConfig => ({
    model: settings.OPENAI_MODEL || DEFAULT_MODEL,
    temperature: Number(settings.OPENAI_TEMPERATURE || DEFAULT_TEMPERATURE),
    topP: settings.OPENAI_TOP_P ? Number(settings.OPENAI_TOP_P) : undefined,
    frequencyPenalty: settings.OPENAI_FREQUENCY_PENALTY
        ? Number(settings.OPENAI_FREQUENCY_PENALTY)
        : undefined,
    presencePenalty: settings.OPENAI_PRESENCE_PENALTY
        ? Number(settings.OPENAI_PRESENCE_PENALTY)
        : undefined,
    apiUrl: API_URL,
    apiKey: settings.OPENAI_API_KEY,
})

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
                    description: 'Suggested replies for me',
                },
            },
            required: ['summary', 'replies'],
        },
    },
}

export const getOpenaiReply = async (
    messages: Message[],
    tone: ToneType,
    context: string
): Promise<{ summary: string; replies: string[] }> => {
    const config = getConfig()

    if (!config.apiKey) {
        return {
            summary: 'OpenAI API key is not configured.',
            replies: ['Please set up your OpenAI API key in the .env file.'],
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
        ...(config.topP && { top_p: config.topP }),
        ...(config.frequencyPenalty && { frequency_penalty: config.frequencyPenalty }),
        ...(config.presencePenalty && { presence_penalty: config.presencePenalty }),
        response_format: { type: 'text' },
    }

    logger.debug({ body }, 'Sending request to OpenAI')
    logger.info('Sending request to OpenAI')

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.apiKey}`,
            },
            body: JSON.stringify(body),
        })

        logger.debug(
            { status: response.status, statusText: response.statusText },
            'OpenAI API response received'
        )

        if (!response.ok) {
            logger.error({ status: response.status }, 'OpenAI API error')
            throw new Error(`OpenAI API error code ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        const rawOutput = data.choices[0]?.message?.content || ''

        if (!rawOutput) {
            throw new Error('Empty response from OpenAI')
        }

        const summary = parseSummaryToHumanReadable(rawOutput)
        const replies = extractReplies(rawOutput)

        if (!summary || !replies.length) {
            logger.error({ rawOutput }, 'Failed to parse response from OpenAI')
            throw new Error('Invalid response format from OpenAI')
        }

        return { summary, replies }
    } catch (error) {
        logger.error({ error }, 'Error in getOpenaiReply (fetching or parsing OpenAI response)')
        return {
            summary: '',
            replies: ['(AI API error. Check your key and usage.)'],
        }
    }
}
