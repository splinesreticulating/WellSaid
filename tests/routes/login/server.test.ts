import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RequestEvent } from '@sveltejs/kit'
import * as serverModule from '../../../src/routes/login/+page.server'

vi.mock('$env/static/private', () => ({
    BASIC_AUTH_USERNAME: 'user',
    BASIC_AUTH_PASSWORD: 'pass',
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

function createMockEvent(url: URL, formData: FormData): RequestEvent {
    return {
        request: new Request(url, { method: 'POST', body: formData }),
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
})
