import { OPENAI_API_KEY, OPENAI_MODEL, OPENAI_TEMPERATURE } from '$env/static/private'
import { logger } from './logger'
import { PERMANENT_CONTEXT, buildReplyPrompt } from './prompts'
import type { Message } from './types'
import { extractReplies, formatMessages, parseSummaryToHumanReadable } from './utils'

const openaiModel = OPENAI_MODEL || 'gpt-4'
const openaiTemperature = Number.parseFloat(OPENAI_TEMPERATURE || '0.5')
const openaiApiUrl = 'https://api.openai.com/v1/chat/completions'

if (!OPENAI_API_KEY)
    logger.warn('⚠️ OPENAI_API_KEY is not set. OpenAI integration will not work.')

export const getOpenaiReply = async (
    messages: Message[],
    tone: string,
    context: string,
): Promise<{ summary: string, replies: string[] }> => {
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
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: openaiModel,
                messages: [
                    { role: 'system', content: PERMANENT_CONTEXT },
                    { role: 'user', content: prompt }
                ],
                temperature: openaiTemperature,
            }),
        })

        if (!response.ok) {
            logger.error({ status: response.status }, 'OpenAI API error')
            throw new Error(`OpenAI API error: ${response.status}`)
        }

        logger.debug({ status: response.status, statusText: response.statusText }, 'OpenAI API response status')
        const data = await response.json()
        logger.debug({ data }, 'OpenAI API raw data')

        const rawOutput = data.choices?.[0]?.message?.content || ''
        logger.debug({ rawOutput }, 'OpenAI API raw output content')

        const summary = parseSummaryToHumanReadable(rawOutput)
        const replies = extractReplies(rawOutput)
        logger.debug({ summary, replies }, 'Parsed summary and replies from OpenAI')

        return { summary, replies }
    } catch (err) {
        logger.error({ err }, 'Error in getOpenaiReply (fetching or parsing OpenAI response)')
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)']
        }
    }
}
