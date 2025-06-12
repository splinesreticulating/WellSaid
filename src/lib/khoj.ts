import { KHOJ_AGENT, KHOJ_API_URL } from '$env/static/private'
import { khojPrompt } from '$lib/prompts'
import type { Message, ToneType } from '$lib/types'
import { extractReplies, parseSummaryToHumanReadable } from '$lib/utils'
import { fetchRelevantHistory } from './history'
import { logger } from './logger'

const khojApiUrl = KHOJ_API_URL || 'http://localhost:42110/api/chat'

export const getKhojReply = async (
    messages: Message[],
    tone: ToneType,
    context: string
): Promise<{ summary: string; replies: string[]; messageCount: number }> => {
    const historyContext = await fetchRelevantHistory(messages)
    const mergedContext = [historyContext, context].filter(Boolean).join('\n')
    const prompt = khojPrompt(messages, tone, mergedContext)
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

        logger.debug({ rawOutput }, 'Khoj raw response')

        const summary = parseSummaryToHumanReadable(rawOutput)
        const replies = extractReplies(rawOutput)

        logger.debug({ summary, replies }, 'Khoj parsed response')

        return { summary, replies, messageCount: messages.length }
    } catch (err: unknown) {
        logger.error({ error: err }, 'Failed to get Khoj reply')
        return {
            summary: '',
            replies: ['(AI API error. Check your key and usage.)'],
            messageCount: messages.length,
        }
    }
}
