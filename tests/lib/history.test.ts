import { fetchRelevantHistory } from '$lib/history'
import type { Message } from '$lib/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/iMessages', () => ({
    queryMessagesDb: vi.fn(),
}))

vi.mock('$env/static/private', () => ({
    HISTORY_LOOKBACK_HOURS: '1',
    LOG_LEVEL: 'info',
}))

const { queryMessagesDb } = await import('$lib/iMessages')

describe('fetchRelevantHistory', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('returns empty string when no history found', async () => {
        vi.mocked(queryMessagesDb).mockResolvedValue({ messages: [] })
        const messages: Message[] = [
            { sender: 'partner', text: 'hi', timestamp: '2025-05-20T10:00:00Z' },
        ]
        const result = await fetchRelevantHistory(messages)
        expect(result).toBe('')
    })

    it('returns formatted history when messages exist', async () => {
        vi.mocked(queryMessagesDb).mockResolvedValue({
            messages: [
                { sender: 'me', text: 'old1', timestamp: '2025-05-19T09:00:00Z' },
                {
                    sender: 'partner',
                    text: 'old2',
                    timestamp: '2025-05-19T09:05:00Z',
                },
            ],
        })
        const messages: Message[] = [
            { sender: 'partner', text: 'hi', timestamp: '2025-05-20T10:00:00Z' },
        ]
        const result = await fetchRelevantHistory(messages)
        expect(result).toContain('Me: old1')
        expect(result).toContain('Partner: old2')
    })

    it('does not include input messages in the returned history', async () => {
        const inputMessages = [
            { sender: 'me', text: 'current message', timestamp: '2025-05-20T10:00:00Z' },
            { sender: 'partner', text: 'another current', timestamp: '2025-05-20T10:01:00Z' }
        ]
        
        // Mock queryMessagesDb to return a message that has the same text as one of the input messages
        vi.mocked(queryMessagesDb).mockResolvedValue({
            messages: [
                { sender: 'me', text: 'current message', timestamp: '2025-05-20T09:59:00Z' }, // Same text as input
                { sender: 'partner', text: 'old message', timestamp: '2025-05-20T09:30:00Z' }
            ]
        })

        const result = await fetchRelevantHistory(inputMessages)
        
        // Verify that the message with the same text as input is not in the result
        expect(result).not.toContain('current message')
        // But other messages should still be there
        expect(result).toContain('Partner: old message')
    })
})
