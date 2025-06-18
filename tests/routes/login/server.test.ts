import type { RequestEvent } from '@sveltejs/kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as serverModule from '../../../src/routes/login/+page.server'

vi.mock('$env/static/private', () => ({
    APP_USERNAME: 'user',
    APP_PASSWORD: 'pass',
    JWT_SECRET: 'secret',
}))

vi.mock('$lib/logger', () => ({
    logger: {
        error: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    },
}))

vi.mock('jsonwebtoken', () => ({
    default: { sign: vi.fn().mockReturnValue('token') },
}))

function createMockEvent(
    url: URL,
    formData: FormData,
    headers: Record<string, string> = {}
): RequestEvent {
    return {
        request: new Request(url, { method: 'POST', body: formData, headers }),
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
        route: { id: '/login' },
        setHeaders: vi.fn(),
        url,
        isDataRequest: false,
        isSubRequest: false,
    } as unknown as RequestEvent
}

describe('login page server action', () => {
    beforeEach(() => {
        vi.resetAllMocks()
    })

    it('redirects to root with lookBackHours when credentials are valid', async () => {
        const formData = new FormData()
        formData.append('username', 'user')
        formData.append('password', 'pass')

        const event = createMockEvent(new URL('https://example.com/login'), formData)

        await expect(serverModule.actions.default(event)).rejects.toMatchObject({
            status: 303,
            location: '/?lookBackHours=1',
        })
        expect(event.cookies.set).toHaveBeenCalled()
    })

    it('sets secure cookie when x-forwarded-proto indicates https', async () => {
        const formData = new FormData()
        formData.append('username', 'user')
        formData.append('password', 'pass')

        const event = createMockEvent(new URL('http://example.com/login'), formData, {
            'x-forwarded-proto': 'https',
        })

        await expect(serverModule.actions.default(event)).rejects.toMatchObject({
            status: 303,
            location: '/?lookBackHours=1',
        })
        const call = event.cookies.set.mock.calls[0]
        expect(call[2]).toMatchObject({ secure: true })
    })
})
