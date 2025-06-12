import { HISTORY_LOOKBACK_HOURS } from '$env/static/private'
import { queryMessagesDb } from '$lib/iMessages'
import type { Message } from '$lib/types'
import { logger } from './logger'

const lookbackHours = Number.parseInt(HISTORY_LOOKBACK_HOURS || '0')

const formatMessage = ({ sender, text }: Message): string => 
    `${sender === 'me' ? 'Me' : 'Partner'}: ${text}`

const getTimeRange = (latestMessageTime: string, lookbackHours: number) => {
    const end = new Date(latestMessageTime)
    const start = new Date(Date.now() - lookbackHours * 60 * 60 * 1000)
    return { start, end }
}

export const fetchRelevantHistory = async (messages: Message[]): Promise<string> => {
    if (!lookbackHours || messages.length === 0) return ''

    try {
        const { start, end } = getTimeRange(messages[0].timestamp, lookbackHours)
        
        logger.debug({ lookbackHours, start, end }, 'Fetching message history')
        
        const { messages: history } = await queryMessagesDb(
            start.toISOString(), 
            end.toISOString()
        )
        
        if (!history.length) return ''

        const inputTexts = new Set(messages.map(m => m.text))
        const filteredHistory = history.filter(m => !inputTexts.has(m.text))
        
        const historyText = filteredHistory.map(formatMessage).join('\n')
        
        logger.debug({
            historyText,
            filtered: history.length - filteredHistory.length,
            total: history.length
        }, 'Fetched message history')
        
        return historyText
    } catch (error) {
        logger.error({ error }, 'Failed to fetch history context')
        return ''
    }
}
