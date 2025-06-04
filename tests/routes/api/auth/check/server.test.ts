import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { GET } from '../../../../../src/routes/api/auth/check/+server'

// Mock the environment variables and logger
vi.mock('$env/static/private', () => ({ JWT_SECRET: 'testsecret' }))
vi.mock('$lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}))

// Helper function to create a minimal mock event
function createMockEvent(token?: string) {
  return {
    cookies: {
      get: vi.fn().mockImplementation((name: string) => name === 'auth_token' ? token : undefined)
    }
    // Add other required properties with default values
  } as const
}

describe('auth check endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns authenticated true for valid token', async () => {
    const token = jwt.sign({ sub: 'user' }, 'testsecret', { algorithm: 'HS256' })
    const mockEvent = createMockEvent(token)
    // @ts-expect-error - We're only mocking the parts we need for this test
    const response = await GET(mockEvent)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.authenticated).toBe(true)
  })

  it('returns 401 when no token is provided', async () => {
    const mockEvent = createMockEvent()
    // @ts-expect-error - We're only mocking the parts we need for this test
    const response = await GET(mockEvent)
    const body = await response.json()
    expect(response.status).toBe(401)
    expect(body.authenticated).toBe(false)
  })

  it('returns 401 for invalid token', async () => {
    const mockEvent = createMockEvent('invalid.token.here')
    // @ts-expect-error - We're only mocking the parts we need for this test
    const response = await GET(mockEvent)
    const body = await response.json()
    expect(response.status).toBe(401)
    expect(body.authenticated).toBe(false)
  })
})
