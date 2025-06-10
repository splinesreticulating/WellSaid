import { KHOJ_AGENT, KHOJ_API_URL } from '$env/static/private'
import { buildKhojPrompt } from '$lib/prompt'
import type { Message, ToneType } from '$lib/types'
import { extractReplies, formatAsUserAndAssistant, parseSummaryToHumanReadable } from '$lib/utils'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'

const khojApiUrl = KHOJ_API_URL || 'http://localhost:42110/api/chat'

export const getKhojReply = async (
    messages: Message[],
    tone: ToneType,
    context: string
): Promise<{ summary: string; replies: string[]; messageCount: number }> => {
    const conversation = formatAsUserAndAssistant(messages)
    const historyContext = await fetchRelevantHistory(messages)
    const mergedContext = [historyContext, context].filter(Boolean).join('\n')
    const prompt = buildKhojPrompt(conversation, tone, mergedContext)
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
