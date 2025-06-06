import { HISTORY_LOOKBACK_HOURS } from '$env/static/private'
import { queryMessagesDb } from '$lib/iMessages'
import type { Message } from '$lib/types'
import { logger } from './logger'

const lookbackHours = Number.parseInt(HISTORY_LOOKBACK_HOURS || '0')

export const fetchRelevantHistory = async (messages: Message[]): Promise<string> => {
    if (!lookbackHours || messages.length === 0) return ''

    try {
        const now = new Date()
        const end = new Date(messages[0].timestamp)
        const start = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)

        logger.debug(
            {
                lookbackHours,
                queryRange: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                },
                now: now.toISOString(),
            },
            'Fetching message history',
        )

        const { messages: history } = await queryMessagesDb(start.toISOString(), end.toISOString())

        logger.debug(
            {
                historyCount: history.length,
                timeRange: `${start.toISOString()} to ${end.toISOString()}`,
            },
            'Fetched message history',
        )

        if (history.length === 0) return ''

        const context = history
            .map((m) => `${m.sender === 'me' ? 'Me' : 'Partner'}: ${m.text}`)
            .join('\n')

        logger.debug(
            {
                historyCount: history.length,
                contextLength: context.length,
                timeRange: `${start.toISOString()} to ${end.toISOString()}`,
            },
            `Fetched additional history context from ${history.length} messages`,
        )

        return context
    } catch (err) {
        logger.error({ err }, 'Failed to fetch history context')
        return ''
    }
}
