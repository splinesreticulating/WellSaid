import { getDefaultProvider, validateProviders } from './providers/registry'

export const DEFAULT_PROVIDER = getDefaultProvider()

// Validate that at least one provider is configured
validateProviders()
