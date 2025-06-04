import dotenv from 'dotenv'
import { logger } from './logger'
import { PERMANENT_CONTEXT, buildReplyPrompt } from './prompts'
import type { Message } from './types'
import { extractReplies, formatMessagesToRecentText, parseSummaryToHumanReadable } from './utils'

dotenv.config()

const openaiModel = process.env.OPENAI_MODEL || 'gpt-4'
const openaiTemperature = Number.parseFloat(process.env.OPENAI_TEMPERATURE || '0.5')
const openaiApiUrl = 'https://api.openai.com/v1/chat/completions'

if (!process.env.OPENAI_API_KEY)
    logger.warn('⚠️ OPENAI_API_KEY is not set. OpenAI integration will not work.')

export const getOpenaiReply = async (
    messages: Message[],
    tone: string,
    context: string,
): Promise<{ summary: string, replies: string[] }> => {
    if (!process.env.OPENAI_API_KEY)
        return {
            summary: 'OpenAI API key is not configured.',
            replies: ['Please set up your OpenAI API key in the .env file.'],
        }

    const recentText = formatMessagesToRecentText(messages)
    const prompt = buildReplyPrompt(recentText, tone, context)

    logger.debug({ prompt }, 'Sending prompt to OpenAI')

    try {
        const response = await fetch(openaiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
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

        return { summary, replies };
    } catch (err) {
        logger.error({ err }, 'Error in getOpenaiReply (fetching or parsing OpenAI response)')
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)']
        }
    }
}
