import { HISTORY_LOOKBACK_HOURS } from '$env/static/private'
import { queryMessagesDb } from '$lib/iMessages'
import type { Message } from '$lib/types'
import { logger } from './logger'

const lookbackHours = Number.parseInt(HISTORY_LOOKBACK_HOURS || '0')

export const fetchRelevantHistory = async (
    messages: Message[],
): Promise<string> => {
    if (!lookbackHours || messages.length === 0) return ''

    try {
        const first = new Date(messages[0].timestamp)
        const start = new Date(first.getTime() - lookbackHours * 60 * 60 * 1000)
        const { messages: history } = await queryMessagesDb(
            start.toISOString(),
            first.toISOString(),
        )
        const context = history
            .map((m) => `${m.sender === 'me' ? 'Me' : 'Partner'}: ${m.text}`)
            .join('\n')
        logger.debug({ context }, 'Fetched additional history context')
        return context
    } catch (err) {
        logger.error({ err }, 'Failed to fetch history context')
        return ''
    }
}
