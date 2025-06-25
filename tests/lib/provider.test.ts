import { describe, expect, it, vi } from 'vitest'

vi.mock('$lib/providers/registry', () => ({
    getDefaultProvider: vi.fn(() => 'openai'),
}))

describe('provider module', () => {
    it('exports the default provider when registry succeeds', async () => {
        const mod = await import('$lib/provider')
        expect(mod.DEFAULT_PROVIDER).toBe('openai')
    })

    it('sets null when registry throws', async () => {
        vi.resetModules()
        vi.doMock('$lib/providers/registry', () => ({
            getDefaultProvider: vi.fn(() => {
                throw new Error('no providers')
            }),
        }))

        const mod = await import('$lib/provider')
        expect(mod.DEFAULT_PROVIDER).toBeNull()
    })
})
