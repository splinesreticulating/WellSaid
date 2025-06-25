import { getGrokReply } from '$lib/grok'
import type { Message } from '$lib/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/history', () => ({
    fetchRelevantHistory: vi.fn().mockResolvedValue('history context'),
}))

vi.mock('$lib/prompts', () => ({
    openAiPrompt: vi.fn().mockReturnValue('prompt'),
    systemContext: () => 'sys',
}))

vi.mock('$lib/config', () => ({
    settings: {
        GROK_API_KEY: 'test-api-key',
        GROK_MODEL: 'test-model',
        GROK_TEMPERATURE: '0.5',
    },
}))

describe('getGrokReply', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            tool_calls: [
                                {
                                    function: {
                                        name: 'draft_replies',
                                        arguments: JSON.stringify({
                                            summary: 'sum',
                                            replies: ['r1', 'r2', 'r3'],
                                        }),
                                    },
                                },
                            ],
                        },
                    },
                ],
            }),
        })
    })

    it('returns parsed summary and replies on success', async () => {
        const messages: Message[] = [{ sender: 'me', text: 'hi', timestamp: '1' }]
        const result = await getGrokReply(messages, 'gentle', '')

        expect(result.summary).toBe('sum')
        expect(result.replies).toEqual(['r1', 'r2', 'r3'])
        expect(global.fetch).toHaveBeenCalled()
    })

    it('handles fetch failure gracefully', async () => {
        vi.resetAllMocks()
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: 'err',
        })
        const messages: Message[] = [{ sender: 'me', text: 'hi', timestamp: '1' }]
        const result = await getGrokReply(messages, 'gentle', '')
        expect(result.replies).toEqual(['(AI API error. Check your key and usage.)'])
        expect(result.summary).toBe('')
    })
})
