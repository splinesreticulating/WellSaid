import { HISTORY_LOOKBACK_HOURS } from '$env/static/private'
import type { Message } from '$lib/types'
import { queryMessagesDb } from './iMessages'
import { logger } from './logger'
import { formatMessagesAsText } from './utils'

const lookbackHours = Number.parseInt(HISTORY_LOOKBACK_HOURS || '0')

export const fetchRelevantHistory = async (messages: Message[]): Promise<string> => {

    logger.debug({
        original: messages[0].timestamp,
        isoParsed: new Date(messages[0].timestamp).toISOString(),
        localParsed: new Date(messages[0].timestamp).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
    }, 'Timestamp interpretation test')

    try {
        if (!lookbackHours || messages.length === 0) {
            logger.warn('No messages or invalid lookbackHours; skipping history fetch')
            return ''
        }

        const earliestTimestampMs = new Date(messages[0].timestamp).getTime()
        const end = new Date(earliestTimestampMs - 1) // exclude the current message
        const start = new Date(end.getTime() - lookbackHours * 60 * 60 * 1000)

        const { messages: history } = await queryMessagesDb(
            start.toISOString(),
            end.toISOString()
        )

        if (!history.length) {
            logger.debug('No messages found in history window')
            return ''
        }

        const historyText = formatMessagesAsText(history)

        logger.debug({ count: history.length }, 'History messages found')
        return historyText
    } catch (error) {
        logger.error({ error }, 'Failed to fetch history context')
        return ''
    }
}
