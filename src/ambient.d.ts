declare namespace App {
    interface PrivateEnv {
        PARTNER_PHONE: string
        KHOJ_API_URL?: string
        KHOJ_AGENT?: string
        LOG_LEVEL?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'
        OPENAI_API_KEY?: string
        OPENAI_MODEL?: string
        OPENAI_TEMPERATURE?: string
        OPENAI_TOP_P?: string
        OPENAI_FREQUENCY_PENALTY?: string
        OPENAI_PRESENCE_PENALTY?: string
        CUSTOM_CONTEXT?: string
    }
}
