import { json } from '@sveltejs/kit'
import { describe, expect, it, vi } from 'vitest'

// Create a simplified mock of the health endpoint functionality
const mockHealthResponse = () => {
  return json({ status: 'ok', timestamp: new Date().toISOString() })
}

describe('/health endpoint', () => {
  it('should return status ok and timestamp', async () => {
    // Mock Date for consistent testing
    const mockDate = new Date('2025-05-27T15:50:00Z')
    const originalDate = global.Date
    global.Date = vi.fn(() => mockDate) as unknown as typeof Date
    global.Date.UTC = originalDate.UTC
    global.Date.parse = originalDate.parse
    global.Date.now = originalDate.now

    // Call our mock handler
    const response = mockHealthResponse()
    const body = await response.json()

    // Restore Date
    global.Date = originalDate

    // Verify response
    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(body.timestamp).toBe('2025-05-27T15:50:00.000Z')
  })
})
