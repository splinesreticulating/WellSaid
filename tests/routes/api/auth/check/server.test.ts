import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { GET } from '../../../../../src/routes/api/auth/check/+server'

vi.mock('$env/static/private', () => ({ JWT_SECRET: 'testsecret' }))
vi.mock('$lib/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }))

function createEvent(token?: string) {
  return {
    cookies: {
      get: vi.fn().mockReturnValue(token)
    }
  }
}

describe('auth check endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns authenticated true for valid token', async () => {
    const token = jwt.sign({ sub: 'user' }, 'testsecret', { algorithm: 'HS256' })
    const response = await GET(createEvent(token) as any)
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.authenticated).toBe(true)
  })

  it('returns 401 when no token is provided', async () => {
    const response = await GET(createEvent() as any)
    const body = await response.json()
    expect(response.status).toBe(401)
    expect(body.authenticated).toBe(false)
  })

  it('returns 401 for invalid token', async () => {
    const badToken = jwt.sign({ sub: 'user' }, 'badsecret', { algorithm: 'HS256' })
    const response = await GET(createEvent(badToken) as any)
    const body = await response.json()
    expect(response.status).toBe(401)
    expect(body.authenticated).toBe(false)
  })
})
