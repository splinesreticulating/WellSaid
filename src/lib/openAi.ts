import dotenv from 'dotenv'
import { logger } from './logger'
import { buildReplyPrompt, permanentContext } from './prompts'
import type { Message } from './types'
import { parseSummaryToHumanReadable } from './utils'

dotenv.config()

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4'
const OPENAI_TEMPERATURE = Number.parseFloat(process.env.OPENAI_TEMPERATURE || '0.5')
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

if (!process.env.OPENAI_API_KEY) {
    logger.warn('⚠️ OPENAI_API_KEY is not set. OpenAI integration will not work.')
} else {
    logger.info({ model: OPENAI_MODEL }, '🤖 Using OpenAI API')
}

export const getSuggestedReplies = async (
    messages: Message[],
    tone: string,
    context: string,
): Promise<{ summary: string, replies: string[] }> => {
    if (!process.env.OPENAI_API_KEY) {
        return {
            summary: 'OpenAI API key is not configured.',
            replies: ['Please set up your OpenAI API key in the .env file.'],
        }
    }

    const recentText = messages.map((m) => {
        const tag =
            m.sender === 'me'
                ? 'Me'
                : m.sender === 'partner'
                    ? 'Partner'
                    : m.sender
        return `${tag}: ${m.text}`
    })

    const prompt = buildReplyPrompt(recentText, tone, context)

    logger.debug({ prompt }, 'Sending prompt to OpenAI')

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: OPENAI_MODEL,
                messages: [
                    { role: 'system', content: permanentContext },
                    { role: 'user', content: prompt }
                ],
                temperature: OPENAI_TEMPERATURE,
            }),
        })

        if (!response.ok) {
            let errorBody: string
            try {
                errorBody = await response.text()
            } catch (e) {
                errorBody = '(could not read body)'
            }
            logger.error(
                { status: response.status, body: errorBody },
                'OpenAI API error'
            )
            throw new Error(`OpenAI API error: ${response.status}`)
        }

        const data = await response.json()
        const rawOutput = data.choices[0]?.message?.content || ''

        // Extract summary as everything before the first reply
        const summary = parseSummaryToHumanReadable(rawOutput)

        // Extract replies using a combined regex and clean them
        function cleanReply(text: string): string {
            return text
                .replace(/^\*+\s*/, '') // Remove leading asterisks and spaces
                .replace(/^"/, '')      // Remove leading quote
                .replace(/"$/, '')      // Remove trailing quote
                .trim()
        }

        // Match both '**Reply 1:**' and 'Reply 1:'
        const replyPattern = /\*\*Reply\s*\d:\*\*\s*(.*)|Reply\s*\d:\s*(.*)/g
        const replies = Array.from(rawOutput.matchAll(replyPattern))
            .map((m) => {
                const match = m as RegExpMatchArray
                return cleanReply(match[1] || match[2] || '')
            })
            .filter(Boolean)

        return { summary, replies }
    } catch (err) {
        logger.error({ err }, 'Error generating replies')
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)']
        }
    }
}
