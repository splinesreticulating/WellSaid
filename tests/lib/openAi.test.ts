import { getOpenaiReply } from '$lib/openAi'
import type { Message } from '$lib/types'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

// Helper function to get the request body from the fetch mock
function getFetchRequestBody<T = unknown>(callIndex = 0): T {
    const fetchMock = global.fetch as Mock
    const fetchCall = fetchMock.mock.calls[callIndex][1] as { body?: string }
    return JSON.parse(fetchCall.body as string) as T
}

// Mock configuration settings
vi.mock('$lib/config', () => ({
    settings: {
        OPENAI_API_KEY: 'test-api-key',
        OPENAI_MODEL: 'test-model',
        OPENAI_TEMPERATURE: '0.5',
        OPENAI_TOP_P: '0.7',
        OPENAI_FREQUENCY_PENALTY: '0.1',
        OPENAI_PRESENCE_PENALTY: '0.2',
        CUSTOM_CONTEXT: 'Act as my therapist suggesting replies to my contact',
    },
}))

vi.mock('$lib/history', () => ({
    fetchRelevantHistory: vi.fn().mockResolvedValue('old context'),
}))

describe('getOpenaiReply', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        ;(await import('$lib/config')).settings.OPENAI_API_KEY = 'test-api-key'
        // Mock the fetch function with the correct response structure
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: `Summary: Here's a summary of the conversation. The conversation is about planning a weekend trip. Your contact seems excited about going hiking.

Reply 1: I'm excited about the hiking trip too! What trails are you thinking about?
Reply 2: The hiking sounds fun! Should we plan to bring a picnic lunch?
Reply 3: I'm looking forward to our hiking adventure! Do we need to get any new gear?`
                        }
                    }
                ]
            })
        })
    })

    it('should return summary and replies when API call is successful', async () => {
        const messages: Message[] = [
            {
                sender: 'contact',
                text: "Let's go hiking this weekend!",
                timestamp: '2025-05-23T12:00:00Z',
            },
            {
                sender: 'me',
                text: 'That sounds fun!',
                timestamp: '2025-05-23T12:01:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        // The summary should be truthy
        expect(result.summary).toBeTruthy()
        expect(result.replies.length).toBe(3)
        expect(result.replies[0]).toContain('excited about the hiking trip')

        // Verify fetch was called with correct parameters
        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
            'https://api.openai.com/v1/chat/completions',
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Content-Type': 'application/json',
                    Authorization: 'Bearer test-api-key',
                }),
                body: expect.any(String),
            })
        )

        const body = getFetchRequestBody<{ messages: Array<{ role: string }> }>()
        expect(body.messages).toHaveLength(3)
        expect(body.messages[0].role).toBe('system')
        expect(body.messages[1].role).toBe('user')
        expect(body.messages[2].role).toBe('user')
    })

    it('should handle API errors gracefully with API key set', async () => {
        // Mock fetch to return an error
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            text: vi.fn().mockResolvedValue('Internal Server Error'),
        })

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'How are you today?',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toBe('')
        expect(result.replies).toEqual(['(AI API error. Check your key and usage.)'])
    })

    it('should handle case when OPENAI_API_KEY is not set', async () => {
        // Mock the setting without the API key
        ;(await import('$lib/config')).settings.OPENAI_API_KEY = ''

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Hello!',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toBe('OpenAI API key is not configured.')
        expect(result.replies).toEqual(['Please set up your OpenAI API key in the .env file.'])
    })

    it('should correctly parse replies with special characters', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: 'Summary: Summary goes here.\n\nSuggested replies:\nReply 1: This reply has *asterisks* and "quotes"\nReply 2: This one has - dashes - and _underscores_\nReply 3: This one is normal',
                        },
                    },
                ],
            }),
        })

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test message with special characters',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        // The summary includes the 'Suggested replies' suffix from parseSummaryToHumanReadable
        expect(result.summary).toBe('Summary goes here.\n\nSuggested replies:')
        // The quotes in the first reply should be preserved
        expect(result.replies[0]).toBe('This reply has *asterisks* and "quotes')
        expect(result.replies[1]).toBe('This one has - dashes - and _underscores_')
        expect(result.replies[2]).toBe('This one is normal')
    })

    it('should handle API errors gracefully', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
        })

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test error handling',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toBe('')
        expect(result.replies).toEqual(['(AI API error. Check your key and usage.)'])
    })

    it('should handle case when OPENAI_API_KEY is not set', async () => {
        ;(await import('$lib/config')).settings.OPENAI_API_KEY = ''

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test no API key',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toContain('OpenAI API key is not configured')
        expect(result.replies[0]).toContain('set up your OpenAI API key')
    })

    it('includes optional parameters when environment variables are set', async () => {
        // Set up environment variables for optional parameters
        const settings = await import('$lib/config').then((m) => m.settings)
        settings.OPENAI_TOP_P = '0.7'
        settings.OPENAI_FREQUENCY_PENALTY = '0.1'
        settings.OPENAI_PRESENCE_PENALTY = '0.2'

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test with optional parameters',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        await getOpenaiReply(messages, 'gentle', '')

        const body = getFetchRequestBody()
        expect(body).toHaveProperty('temperature', 0.5)
        // These should now be included since we set them in the environment
        expect(body).toHaveProperty('top_p', 0.7)
        expect(body).toHaveProperty('frequency_penalty', 0.1)
        expect(body).toHaveProperty('presence_penalty', 0.2)
    })

    it('uses default temperature when not set in environment', async () => {
        const settings = await import('$lib/config').then((m) => m.settings)
        settings.OPENAI_TEMPERATURE = ''
        settings.OPENAI_TOP_P = ''
        settings.OPENAI_FREQUENCY_PENALTY = ''
        settings.OPENAI_PRESENCE_PENALTY = ''

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test without optional parameters',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        await getOpenaiReply(messages, 'gentle', '')

        const body = getFetchRequestBody()
        // Default temperature should be used
        expect(body).toHaveProperty('temperature', 0.5)
        // Other parameters should be omitted
        expect(body).not.toHaveProperty('top_p')
        expect(body).not.toHaveProperty('frequency_penalty')
        expect(body).not.toHaveProperty('presence_penalty')
    })

    it('should handle missing tool calls in response', async () => {
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                choices: [
                    {
                        message: {
                            content: 'Summary: Summary goes here.\n\nSuggested replies:\nReply 1: This reply has asterisks and quotes\nReply 2: "This one has just quotes"\nReply 3: *This one has just asterisks*',
                        },
                    },
                ],
            }),
        })

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test missing tool calls',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        // The summary includes the 'Suggested replies' suffix from parseSummaryToHumanReadable
        expect(result.summary).toBe('Summary goes here.\n\nSuggested replies:')
        // The quotes and asterisks should be preserved in the replies
        expect(result.replies[0]).toBe('This reply has asterisks and quotes')
        expect(result.replies[1]).toBe('This one has just quotes')
        expect(result.replies[2]).toBe('This one has just asterisks*')
    })

    it('includes optional parameters when environment variables are set', async () => {
        // Set up environment variables for optional parameters
        const settings = await import('$lib/config').then((m) => m.settings)
        settings.OPENAI_TOP_P = '0.7'
        settings.OPENAI_FREQUENCY_PENALTY = '0.1'
        settings.OPENAI_PRESENCE_PENALTY = '0.2'

        const messages: Message[] = [
            {
                sender: 'contact',
                text: 'Test with optional parameters',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        await getOpenaiReply(messages, 'gentle', '')

        const body = getFetchRequestBody()
        // These should now be included since we set them in the environment
        expect(body).toHaveProperty('top_p', 0.7)
        expect(body).toHaveProperty('frequency_penalty', 0.1)
        expect(body).toHaveProperty('presence_penalty', 0.2)
    })
})
