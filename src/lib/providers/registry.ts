import { KHOJ_API_URL, OPENAI_API_KEY } from '$env/static/private'

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
    // Future providers can be added here with their corresponding env vars
    // {
    //     id: 'anthropic',
    //     name: 'Anthropic',
    //     displayName: 'Anthropic (Claude)',
    //     envVar: 'ANTHROPIC_API_KEY'
    // },
    // {
    //     id: 'gemini',
    //     name: 'Google',
    //     displayName: 'Google (Gemini)',
    //     envVar: 'GOOGLE_API_KEY'
    // }
]

// Environment variable lookup
const ENV_VARS: Record<string, string | undefined> = {
    OPENAI_API_KEY,
    KHOJ_API_URL,
    // Add new env vars here as they become available
    // ANTHROPIC_API_KEY,
    // GOOGLE_API_KEY
}

/**
 * Get all available AI providers based on configured environment variables
 */
export function getAvailableProviders(): ProviderConfig[] {
    return PROVIDER_REGISTRY.map((provider) => ({
        ...provider,
        isAvailable: !!ENV_VARS[provider.envVar],
    })).filter((provider) => provider.isAvailable)
}

/**
 * Get the default provider (prioritizes Khoj if available, falls back to OpenAI)
 */
export function getDefaultProvider(): string {
    const available = getAvailableProviders()

    if (available.length === 0) {
        throw new Error(
            'No AI providers are configured. Please set at least one provider environment variable.'
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

/**
 * Validate that at least one provider is configured
 */
export function validateProviders(): void {
    const available = getAvailableProviders()

    if (available.length === 0) {
        console.error(
            'Error: No AI providers are configured. Set at least one of the following environment variables:'
        )
        PROVIDER_REGISTRY.forEach((provider) => {
            console.error(`  - ${provider.envVar} (for ${provider.displayName})`)
        })
        process.exit(1)
    }
}
