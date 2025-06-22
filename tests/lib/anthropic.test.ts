import { getAnthropicReply } from '$lib/anthropic'
import type { Message } from '$lib/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/history', () => ({
    fetchRelevantHistory: vi.fn().mockResolvedValue('history context'),
}))

vi.mock('$lib/prompts', () => ({
    anthropicPrompt: vi.fn().mockReturnValue('prompt'),
}))

vi.mock('$env/static/private', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<string, string | undefined>
    return {
        ...actual,
        ANTHROPIC_API_KEY: 'test-api-key',
        ANTHROPIC_MODEL: 'test-model',
        ANTHROPIC_TEMPERATURE: '0.5',
        LOG_LEVEL: 'info',
    }
})

describe('getAnthropicReply', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                content: [
                    {
                        type: 'text',
                        text: 'Summary: hi\n\nSuggested replies:\nReply 1: r1\nReply 2: r2',
                    },
                ],
            }),
        })
    })

    it('returns parsed summary and replies on success', async () => {
        const messages: Message[] = [{ sender: 'me', text: 'hi', timestamp: '1' }]
        const result = await getAnthropicReply(messages, 'gentle', '')

        expect(result.summary).toBe('hi')
        expect(result.replies).toEqual(['r1', 'r2'])
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.anthropic.com/v1/messages',
            expect.objectContaining({ method: 'POST' })
        )
    })

    it('handles fetch failure gracefully', async () => {
        ;(global.fetch as unknown as vi.Mock).mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: vi.fn(),
        })
        const messages: Message[] = [{ sender: 'me', text: 'hi', timestamp: '1' }]
        const result = await getAnthropicReply(messages, 'gentle', '')
        expect(result.replies).toEqual(['(AI API error. Check your key and usage.)'])
        expect(result.summary).toBe('')
    })
})
