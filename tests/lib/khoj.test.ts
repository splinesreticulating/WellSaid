import { getKhojReply } from '$lib/khoj'
import type { Message } from '$lib/types'
import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('$lib/history', () => ({
    fetchRelevantHistory: vi.fn().mockResolvedValue('history context'),
}))

vi.mock('$lib/prompts', () => ({
    khojPrompt: vi.fn().mockReturnValue('prompt'),
}))

vi.mock('$lib/config', () => ({
    settings: {
        KHOJ_API_URL: 'http://khoj.test/api',
        KHOJ_AGENT: '',
    },
}))

describe('getKhojReply', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                response: 'Summary: hi\n\nSuggested replies:\nReply 1: r1\nReply 2: r2',
            }),
        })
    })

    it('returns parsed summary and replies on success', async () => {
        const messages: Message[] = [{ sender: 'me', text: 'hi', timestamp: '1' }]
        const result = await getKhojReply(messages, 'gentle', '')

        expect(result.summary).toBe('hi')
        expect(result.replies).toEqual(['r1', 'r2'])
        expect(result.messageCount).toBe(1)
        expect(global.fetch).toHaveBeenCalledWith(
            'http://khoj.test/api',
            expect.objectContaining({
                method: 'POST',
            })
        )
    })

    it('handles fetch failure gracefully', async () => {
        ;(global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: vi.fn(),
        })
        const messages: Message[] = [{ sender: 'me', text: 'hi', timestamp: '1' }]
        const result = await getKhojReply(messages, 'gentle', '')
        expect(result.replies).toEqual(['(AI API error. Check your key and usage.)'])
        expect(result.summary).toBe('')
    })
})
