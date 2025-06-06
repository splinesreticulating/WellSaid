import { KHOJ_AGENT, KHOJ_API_URL } from '$env/static/private'
import { PERMANENT_CONTEXT, buildKhojPrompt } from '$lib/prompts'
import type { Message } from '$lib/types'
import { extractReplies, formatMessages, parseSummaryToHumanReadable } from '$lib/utils'
import { logger } from './logger'

const khojApiUrl = KHOJ_API_URL || 'http://localhost:42110/api/chat'

export const getKhojReply = async (
    messages: Message[],
    tone: string,
    context: string,
): Promise<{ summary: string; replies: string[]; messageCount: number }> => {
    const conversation = formatMessages(messages)
    const prompt = buildKhojPrompt(conversation, tone, context)
    const body = {
        q: prompt,
        ...(KHOJ_AGENT ? { agent: KHOJ_AGENT } : {}),
    }

    logger.debug({ body }, 'Khoj body')

    try {
        const khojRes = await fetch(khojApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        })

        if (!khojRes.ok) {
            logger.error({ status: khojRes.status }, 'Error from Khoj API')
            throw new Error(`Khoj API returned ${khojRes.status}`)
        }

        const data = await khojRes.json()
        const rawOutput = data.response || ''
        const summary = parseSummaryToHumanReadable(rawOutput)
        const replies = extractReplies(rawOutput)

        logger.debug({ summary, replies }, 'Khoj response')

        return { summary, replies, messageCount: messages.length }
    } catch (err: unknown) {
        logger.error({ error: err }, 'Failed to get Khoj reply')
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)'],
            messageCount: messages.length,
        }
    }
}
