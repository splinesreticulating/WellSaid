import { getOpenaiReply } from '$lib/openAi'
import type { Message } from '$lib/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the environment variables
vi.mock('$env/static/private', async (importOriginal) => {
    const actual = (await importOriginal()) as Record<
        string,
        string | undefined
    >
    return {
        ...actual,
        OPENAI_API_KEY: 'test-api-key',
        OPENAI_MODEL: 'test-model',
        OPENAI_TEMPERATURE: '0.5',
        OPENAI_TOP_P: '0.7',
        OPENAI_FREQUENCY_PENALTY: '0.1',
        OPENAI_PRESENCE_PENALTY: '0.2',
        LOG_LEVEL: 'info',
    }
})

describe('getOpenaiReply', () => {
    beforeEach(async () => {
        vi.clearAllMocks()
        vi.mocked(await import('$env/static/private')).OPENAI_API_KEY =
            'test-api-key'
        // Mock the fetch function
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
                                            summary:
                                                "Here's a summary of the conversation. The conversation is about planning a weekend trip. Your partner seems excited about going hiking.",
                                            replies: [
                                                "I'm excited about the hiking trip too! What trails are you thinking about?",
                                                'The hiking sounds fun! Should we plan to bring a picnic lunch?',
                                                "I'm looking forward to our hiking adventure! Do we need to get any new gear?",
                                            ],
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

    it('should return summary and replies when API call is successful', async () => {
        const messages: Message[] = [
            {
                sender: 'partner',
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
            }),
        )

        const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
        expect(body.tools[0].function.name).toBe('draft_replies')
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
                sender: 'partner',
                text: 'How are you today?',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toBe('')
        expect(result.replies).toEqual([
            '(Sorry, I had trouble generating a response.)',
        ])
    })

    it('should handle case when OPENAI_API_KEY is not set', async () => {
        // Mock the environment variables without the API key
        vi.mocked(await import('$env/static/private')).OPENAI_API_KEY = ''

        const messages: Message[] = [
            {
                sender: 'partner',
                text: 'Hello!',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toBe('OpenAI API key is not configured.')
        expect(result.replies).toEqual([
            'Please set up your OpenAI API key in the .env file.',
        ])
    })

    it('should correctly parse replies with special characters', async () => {
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
                                            summary: 'Summary goes here.',
                                            replies: [
                                                'This reply has asterisks and quotes',
                                                '"This one has just quotes"',
                                                '*This one has just asterisks*',
                                            ],
                                        }),
                                    },
                                },
                            ],
                        },
                    },
                ],
            }),
        })

        const messages: Message[] = [
            {
                sender: 'partner',
                text: 'Test message',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        const result = await getOpenaiReply(messages, 'gentle', '')

        expect(result.summary).toBe('Summary goes here.')
        expect(result.replies).toEqual([
            'This reply has asterisks and quotes',
            '"This one has just quotes"',
            '*This one has just asterisks*',
        ])
    })

    it('includes optional parameters when environment variables are set', async () => {
        const messages: Message[] = [
            {
                sender: 'partner',
                text: 'Hello!',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        await getOpenaiReply(messages, 'gentle', '')

        const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
        expect(body.top_p).toBe(0.7)
        expect(body.frequency_penalty).toBe(0.1)
        expect(body.presence_penalty).toBe(0.2)
    })

    it('omits optional parameters when environment variables are empty', async () => {
        vi.mocked(await import('$env/static/private')).OPENAI_TOP_P = ''
        vi.mocked(
            await import('$env/static/private'),
        ).OPENAI_FREQUENCY_PENALTY = ''
        vi.mocked(await import('$env/static/private')).OPENAI_PRESENCE_PENALTY =
            ''
        vi.resetModules()
        const { getOpenaiReply: getOpenaiReplyNoOpts } = await import(
            '$lib/openAi'
        )

        const messages: Message[] = [
            {
                sender: 'partner',
                text: 'Hi',
                timestamp: '2025-05-23T12:00:00Z',
            },
        ]

        await getOpenaiReplyNoOpts(messages, 'gentle', '')

        const body = JSON.parse((global.fetch as any).mock.calls[0][1].body)
        expect(body).not.toHaveProperty('top_p')
        expect(body).not.toHaveProperty('frequency_penalty')
        expect(body).not.toHaveProperty('presence_penalty')
        expect(body).not.toHaveProperty('user')
    })
})
