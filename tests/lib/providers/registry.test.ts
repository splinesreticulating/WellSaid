import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('$lib/config', () => ({ settings: {} }))

// Helper to reload the module with fresh state
async function loadRegistry() {
    const mod = await import('$lib/providers/registry')
    return mod
}

describe('provider registry', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('returns only providers with configured settings', async () => {
        const { settings } = await import('$lib/config')
        settings.OPENAI_API_KEY = 'key'
        settings.GROK_API_KEY = 'grok'
        settings.KHOJ_API_URL = ''
        settings.ANTHROPIC_API_KEY = ''

        const { getAvailableProviders } = await loadRegistry()
        const providers = getAvailableProviders()

        expect(providers.map((p) => p.id)).toEqual(['openai', 'grok'])
        expect(providers.every((p) => p.isAvailable)).toBe(true)
    })

    it('prefers khoj as default when available', async () => {
        const { settings } = await import('$lib/config')
        settings.KHOJ_API_URL = 'http://khoj.test'
        settings.OPENAI_API_KEY = 'key'

        const { getDefaultProvider } = await loadRegistry()
        expect(getDefaultProvider()).toBe('khoj')
    })

    it('throws when no providers are configured', async () => {
        const { settings } = await import('$lib/config')
        Object.keys(settings).forEach((k) => delete (settings as Record<string, unknown>)[k])

        const { getDefaultProvider } = await loadRegistry()
        expect(() => getDefaultProvider()).toThrow(
            'No AI providers are configured. Please set at least one provider in settings.'
        )
    })

    it('detects multiple providers', async () => {
        const { settings } = await import('$lib/config')
        settings.OPENAI_API_KEY = 'key'
        settings.ANTHROPIC_API_KEY = 'a'

        const { hasMultipleProviders } = await loadRegistry()
        expect(hasMultipleProviders()).toBe(true)
    })
})
