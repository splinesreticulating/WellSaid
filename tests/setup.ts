import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock the global fetch function
global.fetch = vi.fn();

// Setup environment variables for testing
process.env.OPENAI_API_KEY = 'test-api-key';
process.env.OPENAI_MODEL = 'gpt-4';

// Reset mocks before each test
beforeEach(() => {
  vi.resetAllMocks();
});
