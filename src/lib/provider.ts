import { getDefaultProvider, validateProviders } from './providers/registry'

// Safe initialization - don't throw errors during module load
let DEFAULT_PROVIDER: string | null = null

try {
    DEFAULT_PROVIDER = getDefaultProvider()
} catch {
    // No providers configured - this is handled gracefully in the UI
    DEFAULT_PROVIDER = null
}

export { DEFAULT_PROVIDER }

// Only validate providers in production or when explicitly requested
// This allows development to continue even without providers configured
export function ensureProvidersConfigured(): void {
    if (process.env.NODE_ENV === 'production') {
        validateProviders()
    }
}
