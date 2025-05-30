import { buildReplyPrompt } from '$lib/prompts'
import type { Message } from '$lib/types'
import { extractReplies, formatMessagesToRecentText, parseSummaryToHumanReadable } from '$lib/utils'
import dotenv from 'dotenv'
import { logger } from './logger'

dotenv.config()

const khojApiUrl = process.env.KHOJ_API_URL || 'http://localhost:42110/api/chat'

export const getKhojReply = async (
  messages: Message[],
  tone: string,
  context: string,
): Promise<{ summary: string; replies: string[]; messageCount: number }> => {
  const recentText = formatMessagesToRecentText(messages)

  const prompt = buildReplyPrompt(recentText, tone, context)

  try {
    const khojRes = await fetch(khojApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: prompt,
        ...(process.env.KHOJ_AGENT ? { agent: process.env.KHOJ_AGENT } : {}),
      }),
    })

    if (!khojRes.ok) {
      logger.error({ status: khojRes.status }, 'Error from Khoj API')
      throw new Error(`Khoj API returned ${khojRes.status}`)
    }

    const data = await khojRes.json()
    const rawOutput = data.response || ''
    const summary = parseSummaryToHumanReadable(rawOutput)
    const replies = extractReplies(rawOutput)

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
