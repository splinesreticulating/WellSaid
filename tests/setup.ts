import '@testing-library/jest-dom'
import { beforeEach, vi } from 'vitest'

// Mock the global fetch function
global.fetch = vi.fn()

// Setup environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key'
process.env.OPENAI_MODEL = 'gpt-4'
process.env.OPENAI_TEMPERATURE = '0.5'
process.env.OPENAI_TOP_P = '0.7'
process.env.OPENAI_FREQUENCY_PENALTY = '0.1'
process.env.OPENAI_PRESENCE_PENALTY = '0.2'

// Reset mocks before each test
beforeEach(() => {
    vi.resetAllMocks()
})
