import { settings } from '$lib/config'

export interface ProviderConfig {
    id: string
    name: string
    displayName: string
    envVar: string
    isAvailable: boolean
}

// Registry of all possible AI providers
const PROVIDER_REGISTRY: Omit<ProviderConfig, 'isAvailable'>[] = [
    {
        id: 'khoj',
        name: 'Khoj',
        displayName: 'Khoj (Local)',
        envVar: 'KHOJ_API_URL',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        displayName: 'OpenAI (GPT)',
        envVar: 'OPENAI_API_KEY',
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        displayName: 'Anthropic (Claude)',
        envVar: 'ANTHROPIC_API_KEY',
    },
    {
        id: 'grok',
        name: 'Grok',
        displayName: 'Grok (X.ai)',
        envVar: 'GROK_API_KEY',
    },
    // Future providers can be added here with their corresponding env vars
    // {
    //     id: 'gemini',
    //     name: 'Google',
    //     displayName: 'Google (Gemini)',
    //     envVar: 'GOOGLE_API_KEY'
    // }
]

/**
 * Get all available AI providers based on configured settings
 */
export function getAvailableProviders(): ProviderConfig[] {
    return PROVIDER_REGISTRY.map((provider) => ({
        ...provider,
        isAvailable: !!settings[provider.envVar],
    })).filter((provider) => provider.isAvailable)
}

/**
 * Get the default provider (prioritizes Khoj if available, falls back to OpenAI)
 */
export function getDefaultProvider(): string {
    const available = getAvailableProviders()

    if (available.length === 0) {
        throw new Error(
            'No AI providers are configured. Please set at least one provider in settings.'
        )
    }

    // Prefer Khoj if available, otherwise use the first available provider
    const khojProvider = available.find((p) => p.id === 'khoj')
    return khojProvider ? 'khoj' : available[0].id
}

/**
 * Check if multiple providers are available
 */
export function hasMultipleProviders(): boolean {
    return getAvailableProviders().length > 1
}
