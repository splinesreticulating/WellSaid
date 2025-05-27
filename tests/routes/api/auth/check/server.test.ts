import { GET } from '$lib/../routes/api/auth/check/+server';
import type { RequestEvent } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';

describe('/api/auth/check GET', () => {
    it('should return authenticated: true when auth_token is valid', async () => {
        const mockCookies = {
            get: vi.fn().mockReturnValue('authenticated'),
            set: vi.fn(),
            delete: vi.fn(),
            serialize: vi.fn(),
            [Symbol.iterator]: vi.fn(),
            getAll: vi.fn(),
        };

        const request = new Request('http://localhost/api/auth/check');
        const requestEvent = {
            cookies: mockCookies,
            request,
            locals: {},
            params: {},
            platform: undefined,
            route: { id: '/api/auth/check' },
            url: new URL('http://localhost/api/auth/check'),
            getClientAddress: vi.fn(),
            isDataRequest: true,
            isSubRequest: true,
            setHeaders: vi.fn(),
        } as unknown as RequestEvent;

        const response = await GET(requestEvent);
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.authenticated).toBe(true);
        expect(body).toHaveProperty('timestamp');
        expect(mockCookies.get).toHaveBeenCalledWith('auth_token');
    });

    it('should return authenticated: false and 401 when auth_token is missing', async () => {
        const mockCookies = {
            get: vi.fn().mockReturnValue(undefined), // Simulate cookie not found
            set: vi.fn(),
            delete: vi.fn(),
            serialize: vi.fn(),
            [Symbol.iterator]: vi.fn(),
            getAll: vi.fn(),
        };

        const request = new Request('http://localhost/api/auth/check');
        const requestEvent = {
            cookies: mockCookies,
            request,
            locals: {},
            params: {},
            platform: undefined,
            route: { id: '/api/auth/check' },
            url: new URL('http://localhost/api/auth/check'),
            getClientAddress: vi.fn(),
            isDataRequest: true,
            isSubRequest: true,
            setHeaders: vi.fn(),
        } as unknown as RequestEvent;

        const response = await GET(requestEvent);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.authenticated).toBe(false);
        expect(body).toHaveProperty('timestamp');
        expect(mockCookies.get).toHaveBeenCalledWith('auth_token');
    });

    it('should return authenticated: false and 401 when auth_token is invalid', async () => {
        const mockCookies = {
            get: vi.fn().mockReturnValue('invalid_token'), // Simulate wrong token value
            set: vi.fn(),
            delete: vi.fn(),
            serialize: vi.fn(),
            [Symbol.iterator]: vi.fn(),
            getAll: vi.fn(),
        };

        const request = new Request('http://localhost/api/auth/check');
        const requestEvent = {
            cookies: mockCookies,
            request,
            locals: {},
            params: {},
            platform: undefined,
            route: { id: '/api/auth/check' },
            url: new URL('http://localhost/api/auth/check'),
            getClientAddress: vi.fn(),
            isDataRequest: true,
            isSubRequest: true,
            setHeaders: vi.fn(),
        } as unknown as RequestEvent;

        const response = await GET(requestEvent);
        const body = await response.json();

        expect(response.status).toBe(401);
        expect(body.authenticated).toBe(false);
        expect(body).toHaveProperty('timestamp');
        expect(mockCookies.get).toHaveBeenCalledWith('auth_token');
    });
});
