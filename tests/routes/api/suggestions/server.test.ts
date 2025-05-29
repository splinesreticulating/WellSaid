import * as ai from '$lib/openAi';
import * as khoj from '$lib/khoj';
import type { RequestEvent } from '@sveltejs/kit'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as serverModule from '../../../../src/routes/api/suggestions/+server'

const ROUTE_ID = '/api/suggestions'

// Mock the AI modules
vi.mock('$lib/openAi', () => ({
  getOpenaiReply: vi.fn()
}));

vi.mock('$lib/khoj', () => ({
  getKhojReply: vi.fn()
}));

// Mock logger to prevent test output pollution
vi.mock('$lib/logger', () => ({
  logger: {
    error: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}))

// Define types for our mock request objects
interface MessageData {
  sender: string
  text: string
  timestamp: string
}

interface RequestData {
  messages?: MessageData[];
  tone?: string;
  context?: string;
  provider?: 'openai' | 'khoj';
}

interface MockRequest {
  json: () => Promise<RequestData>
}

// Helper function to create a mock RequestEvent
function createMockRequestEvent(mockRequest: MockRequest): RequestEvent<Record<string, string>, '/api/suggestions'> {
  return {
    request: mockRequest as unknown as Request,
    cookies: {
      get: vi.fn().mockReturnValue(undefined),
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
    route: {
      id: ROUTE_ID
    },
    setHeaders: vi.fn(),
    url: new URL(`http://localhost${ROUTE_ID}`),
    isDataRequest: false,
    isSubRequest: false
  }
}

describe('POST handler for generate endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should return suggestions when request is valid', async () => {
    // Setup mock response from getSuggestedReplies
    const mockResult = {
      summary: 'This is a summary',
      replies: ['Reply 1', 'Reply 2']
    }
    vi.mocked(ai.getOpenaiReply).mockResolvedValue(mockResult)

    // Create mock request
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        messages: [
          { sender: 'partner', text: 'Hello', timestamp: '2025-05-23T12:00:00Z' }
        ],
        tone: 'gentle',
        context: 'Some context',
        provider: 'openai'
      })
    }

    // Create a proper mock RequestEvent object
    const mockRequestEvent = createMockRequestEvent(mockRequest)

    const response = await serverModule.POST(mockRequestEvent)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual(mockResult)
    expect(ai.getOpenaiReply).toHaveBeenCalledWith(
      [{ sender: 'partner', text: 'Hello', timestamp: '2025-05-23T12:00:00Z' }],
      'gentle',
      'Some context'
    )
  })

  it('should return 400 error when request format is invalid', async () => {
    // Create mock request with invalid format
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        // Missing messages array
        tone: 'gentle'
      })
    }

    // Create a proper mock RequestEvent object
    const mockRequestEvent = createMockRequestEvent(mockRequest)

    const response = await serverModule.POST(mockRequestEvent)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toEqual({ error: 'Invalid request format' })
    expect(ai.getOpenaiReply).not.toHaveBeenCalled();
    expect(khoj.getKhojReply).not.toHaveBeenCalled();
  })

  it('should return 500 error when getSuggestedReplies throws an error', async () => {
    // Setup getOpenaiReply to throw an error
    vi.mocked(ai.getOpenaiReply).mockRejectedValue(new Error('Test error'))

    // Create mock request
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        messages: [
          { sender: 'partner', text: 'Hello', timestamp: '2025-05-23T12:00:00Z' }
        ],
        tone: 'gentle',
        context: '',
        provider: 'openai'
      })
    }

    // Create a proper mock RequestEvent object
    const mockRequestEvent = createMockRequestEvent(mockRequest)

    const response = await serverModule.POST(mockRequestEvent)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: 'Failed to generate suggestions',
      details: 'Test error'
    })
  })
})
