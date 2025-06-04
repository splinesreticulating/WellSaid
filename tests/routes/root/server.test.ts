import * as queryDb from '$lib/iMessages'
import * as openai from '$lib/openAi'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as serverModule from '../../../src/routes/+page.server'
import type { RequestEvent } from '@sveltejs/kit'

vi.mock('$lib/iMessages', () => ({ queryMessagesDb: vi.fn() }))
vi.mock('$lib/openAi', () => ({ getOpenaiReply: vi.fn() }))
vi.mock('$lib/logger', () => ({ logger: { error: vi.fn() } }))

function createMockRequestEvent(url: URL, body?: unknown): RequestEvent<Record<string, string>, '/'> {
  return {
    request: new Request(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    cookies: {
      get: vi.fn(),
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
      delete: vi.fn(),
      serialize: vi.fn()
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
    isSubRequest: false
  }
}

describe('root page server', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('load should return messages', async () => {
    vi.mocked(queryDb.queryMessagesDb).mockResolvedValue({ messages: [{ text: 'hi', sender: 'partner', timestamp: '2025-01-01T00:00:00Z' }] })
    const event = createMockRequestEvent(new URL('https://example.com/'))
    const data = await serverModule.load(event as unknown as Parameters<typeof serverModule.load>[0])
    expect(data).toEqual({ messages: [{ text: 'hi', sender: 'partner', timestamp: '2025-01-01T00:00:00Z' }] })
  })

  it('generate action should return suggestions', async () => {
    vi.mocked(openai.getOpenaiReply).mockResolvedValue({ summary: 'sum', replies: ['r1'] })
    const body = { messages: [], tone: 'gentle', context: '', provider: 'openai' }
    const event = createMockRequestEvent(new URL('https://example.com/'), body)
    const response = await serverModule.actions.generate(event as unknown as Parameters<typeof serverModule.actions.generate>[0])
    const result = await response.json()
    expect(result).toEqual({ summary: 'sum', replies: ['r1'] })
    expect(openai.getOpenaiReply).toHaveBeenCalled()
  })
})
