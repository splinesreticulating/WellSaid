import { fetchRelevantHistory } from '$lib/history'
import type { Message } from '$lib/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/iMessages', () => ({
    queryMessagesDb: vi.fn(),
}))

vi.mock('$lib/config', () => ({
    settings: { HISTORY_LOOKBACK_HOURS: '1' },
}))

const { queryMessagesDb } = await import('$lib/iMessages')

describe('fetchRelevantHistory', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('returns empty string when no history found', async () => {
        vi.mocked(queryMessagesDb).mockResolvedValue({ messages: [] })
        const messages: Message[] = [
            { sender: 'contact', text: 'hi', timestamp: '2025-05-20T10:00:00Z' },
        ]
        const result = await fetchRelevantHistory(messages)
        expect(result).toBe('')
    })

    it('returns formatted history when messages exist', async () => {
        vi.mocked(queryMessagesDb).mockResolvedValue({
            messages: [
                { sender: 'me', text: 'old1', timestamp: '2025-05-19T09:00:00Z' },
                {
                    sender: 'contact',
                    text: 'old2',
                    timestamp: '2025-05-19T09:05:00Z',
                },
            ],
        })
        const messages: Message[] = [
            { sender: 'contact', text: 'hi', timestamp: '2025-05-20T10:00:00Z' },
        ]
        const result = await fetchRelevantHistory(messages)
        expect(result).toContain('me: old1')
        expect(result).toContain('contact: old2')
    })

    it('returns messages from the correct time range', async () => {
        const inputMessages = [
            { sender: 'me', text: 'current message', timestamp: '2025-05-20T10:00:00Z' },
        ]

        // Mock database to return messages before the input message
        vi.mocked(queryMessagesDb).mockResolvedValue({
            messages: [
                { sender: 'me', text: 'older message', timestamp: '2025-05-20T09:30:00Z' },
                { sender: 'contact', text: 'oldest message', timestamp: '2025-05-20T09:00:00Z' },
            ],
        })

        const result = await fetchRelevantHistory(inputMessages)

        // Should only contain messages older than the input
        expect(result).toContain('me: older message')
        expect(result).toContain('contact: oldest message')
        expect(result).not.toContain('current message')
    })
})
