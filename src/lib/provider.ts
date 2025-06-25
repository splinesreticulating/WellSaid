import { getDefaultProvider } from './providers/registry'

// Safe initialization - don't throw errors during module load
let DEFAULT_PROVIDER: string | null = null

try {
    DEFAULT_PROVIDER = getDefaultProvider()
} catch {
    // No providers configured - this is handled in the UI
    DEFAULT_PROVIDER = null
}

export { DEFAULT_PROVIDER }
