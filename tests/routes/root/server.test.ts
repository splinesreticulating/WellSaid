import * as queryDb from '$lib/iMessages'
import * as openai from '$lib/openAi'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as serverModule from '../../../src/routes/+page.server'
import type { RequestEvent } from '@sveltejs/kit'

vi.mock('$lib/iMessages', () => ({ queryMessagesDb: vi.fn() }))
vi.mock('$lib/openAi', () => ({ getOpenaiReply: vi.fn() }))
vi.mock('$lib/logger', () => ({
    logger: {
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}))

function createMockRequestEvent(
    url: URL,
    body?: unknown
): RequestEvent<Record<string, string>, '/'> {
    return {
        request: new Request(url, {
            method: 'POST',
            body: body ? JSON.stringify(body) : undefined,
        }),
        cookies: {
            get: vi.fn(),
            getAll: vi.fn().mockReturnValue([]),
            set: vi.fn(),
            delete: vi.fn(),
            serialize: vi.fn(),
        },
        fetch: vi.fn(),
        getClientAddress: vi.fn(),
        locals: {},
        params: {},
        platform: undefined,
        route: { id: '/' },
        setHeaders: vi.fn(),
        url,
        isDataRequest: false,
        isSubRequest: false,
    }
}

describe('root page server', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('load should return messages', async () => {
        vi.mocked(queryDb.queryMessagesDb).mockResolvedValue({
            messages: [{ text: 'hi', sender: 'partner', timestamp: '2025-01-01T00:00:00Z' }],
        })
        const event = createMockRequestEvent(new URL('https://example.com/'))
        const data = await serverModule.load(
            event as unknown as Parameters<typeof serverModule.load>[0]
        )
        expect(data).toEqual({
            messages: [{ text: 'hi', sender: 'partner', timestamp: '2025-01-01T00:00:00Z' }],
        })
    })

    it('generate action should return suggestions', async () => {
        // Mock the OpenAI response
        const mockResponse = { summary: 'sum', replies: ['r1'] }
        vi.mocked(openai.getOpenaiReply).mockResolvedValue(mockResponse)

        // Create form data
        const formData = new URLSearchParams()
        formData.append(
            'messages',
            JSON.stringify([{ text: 'test', sender: 'user', timestamp: '2025-01-01T00:00:00Z' }])
        )
        formData.append('tone', 'gentle')
        formData.append('context', 'test context')
        formData.append('provider', 'openai')

        // Create a proper Request with form data
        const request = new Request('https://example.com/', {
            method: 'POST',
            body: formData.toString(),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        // Create mock event with the proper request
        const event = {
            ...createMockRequestEvent(new URL('https://example.com/')),
            request,
        }

        // Call the action
        const result = await serverModule.actions.generate(
            event as unknown as Parameters<typeof serverModule.actions.generate>[0]
        )

        // Verify the result is the expected object
        expect(result).toEqual(mockResponse)

        // Verify the OpenAI function was called with the right arguments
        expect(openai.getOpenaiReply).toHaveBeenCalledWith(
            [{ text: 'test', sender: 'user', timestamp: '2025-01-01T00:00:00Z' }],
            'gentle',
            'test context'
        )
    })
})
