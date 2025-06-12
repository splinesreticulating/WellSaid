import * as queryDb from '$lib/iMessages'
import * as openai from '$lib/openAi'
import * as khoj from '$lib/khoj'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as serverModule from '../../../src/routes/+page.server'
import type { RequestEvent } from '@sveltejs/kit'

vi.mock('$lib/iMessages', () => ({ queryMessagesDb: vi.fn() }))
vi.mock('$lib/openAi', () => ({ getOpenaiReply: vi.fn() }))
vi.mock('$lib/khoj', () => ({ getKhojReply: vi.fn() }))
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

    it('load should return messages and multiProvider flag', async () => {
        vi.mocked(queryDb.queryMessagesDb).mockResolvedValue({
            messages: [{ text: 'hi', sender: 'partner', timestamp: '2025-01-01T00:00:00Z' }],
        })
        const event = createMockRequestEvent(new URL('https://example.com/'))
        const data = await serverModule.load(
            event as unknown as Parameters<typeof serverModule.load>[0]
        )
        expect(data).toEqual({
            messages: [{ text: 'hi', sender: 'partner', timestamp: '2025-01-01T00:00:00Z' }],
            multiProvider: false,
        })
    })

    it('generate action should return suggestions', async () => {
        // Mock the OpenAI response
        const mockResponse = { summary: 'sum', replies: ['r1'] }
        vi.mocked(openai.getOpenaiReply).mockResolvedValue(mockResponse)

        // Create form data
        const formData = new FormData()
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
            body: formData,
        })

        // Create mock event with the proper request
        const event = {
            ...createMockRequestEvent(new URL('https://example.com/')),
            request,
        }

        // Call the action
        const result = await serverModule.actions.generate({
            request: event.request,
            // Add other required properties from RequestEvent
            cookies: event.cookies,
            fetch: event.fetch,
            getClientAddress: event.getClientAddress,
            locals: {},
            params: {},
            platform: undefined,
            route: { id: '/' },
            setHeaders: vi.fn(),
            url: event.url,
            isDataRequest: false,
            isSubRequest: false,
        } as unknown as Parameters<typeof serverModule.actions.generate>[0])

        // Verify the result is the expected object
        expect(result).toEqual(mockResponse)

        // Verify the OpenAI function was called with the right arguments
        expect(openai.getOpenaiReply).toHaveBeenCalledWith(
            [{ text: 'test', sender: 'user', timestamp: '2025-01-01T00:00:00Z' }],
            'gentle',
            'test context'
        )
    })

    it('uses Khoj provider when specified', async () => {
        const mockResponse = { summary: 'sum', replies: ['r1'], messageCount: 1 }
        vi.mocked(khoj.getKhojReply).mockResolvedValue(mockResponse)

        const formData = new FormData()
        formData.append(
            'messages',
            JSON.stringify([{ text: 'hi', sender: 'me', timestamp: '2025-01-01T00:00:00Z' }])
        )
        formData.append('tone', 'gentle')
        formData.append('context', '')
        formData.append('provider', 'khoj')

        const request = new Request('https://example.com/', { method: 'POST', body: formData })
        const event = { ...createMockRequestEvent(new URL('https://example.com/')), request }

        const result = await serverModule.actions.generate({
            request: event.request,
            cookies: event.cookies,
            fetch: event.fetch,
            getClientAddress: event.getClientAddress,
            locals: {},
            params: {},
            platform: undefined,
            route: { id: '/' },
            setHeaders: vi.fn(),
            url: event.url,
            isDataRequest: false,
            isSubRequest: false,
        } as unknown as Parameters<typeof serverModule.actions.generate>[0])

        expect(result).toEqual(mockResponse)
        expect(khoj.getKhojReply).toHaveBeenCalled()
    })

    it('returns 400 when messages JSON is invalid', async () => {
        const formData = new FormData()
        formData.append('messages', 'not json')
        formData.append('tone', 'gentle')
        formData.append('context', '')
        formData.append('provider', 'openai')

        const request = new Request('https://example.com/', { method: 'POST', body: formData })
        const event = { ...createMockRequestEvent(new URL('https://example.com/')), request }

        const result = await serverModule.actions.generate({
            request: event.request,
            cookies: event.cookies,
            fetch: event.fetch,
            getClientAddress: event.getClientAddress,
            locals: {},
            params: {},
            platform: undefined,
            route: { id: '/' },
            setHeaders: vi.fn(),
            url: event.url,
            isDataRequest: false,
            isSubRequest: false,
        } as unknown as Parameters<typeof serverModule.actions.generate>[0])

        expect(result.status).toBe(400)
        expect(result.data.error).toBe(
            'Invalid messages format in FormData: Messages could not be parsed to an array.'
        )
    })
})
