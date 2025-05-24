import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as serverModule from './+server';
// Use relative paths for tests instead of SvelteKit aliases
import * as queryDb from '../../../lib/queryMessagesDb';

// Mock the queryMessagesDb module
vi.mock('../../../lib/queryMessagesDb', () => ({
  queryMessagesDb: vi.fn()
}));

describe('GET handler for messages endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return messages when start and end parameters are provided', async () => {
    // Setup mock response from queryMessagesDb
    const mockMessages = [
      { sender: 'partner', text: 'Hello', timestamp: '2025-05-23T12:00:00Z' },
      { sender: 'me', text: 'Hi there', timestamp: '2025-05-23T12:01:00Z' }
    ];
    vi.mocked(queryDb.queryMessagesDb).mockResolvedValue({ messages: mockMessages });

    // Create mock request with URL parameters
    const mockUrl = new URL('https://example.com/api/messages?start=2025-05-23T00:00:00Z&end=2025-05-24T00:00:00Z');
    
    const response = await serverModule.GET({ url: mockUrl } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ messages: mockMessages });
    expect(queryDb.queryMessagesDb).toHaveBeenCalledWith(
      '2025-05-23T00:00:00Z',
      '2025-05-24T00:00:00Z'
    );
  });

  it('should return 400 error when start parameter is missing', async () => {
    // Create mock request with missing start parameter
    const mockUrl = new URL('https://example.com/api/messages?end=2025-05-24T00:00:00Z');
    
    const response = await serverModule.GET({ url: mockUrl } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing start or end' });
    expect(queryDb.queryMessagesDb).not.toHaveBeenCalled();
  });

  it('should return 400 error when end parameter is missing', async () => {
    // Create mock request with missing end parameter
    const mockUrl = new URL('https://example.com/api/messages?start=2025-05-23T00:00:00Z');
    
    const response = await serverModule.GET({ url: mockUrl } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing start or end' });
    expect(queryDb.queryMessagesDb).not.toHaveBeenCalled();
  });
});
