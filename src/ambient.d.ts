declare namespace App {
  interface PrivateEnv {
    PARTNER_PHONE: string
    KHOJ_API_URL?: string
    KHOJ_AGENT?: string
    LOG_LEVEL?: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'
  }
}
