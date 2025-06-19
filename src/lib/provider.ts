import { KHOJ_API_URL, OPENAI_API_KEY } from '$env/static/private'

export const DEFAULT_PROVIDER: 'khoj' | 'openai' = KHOJ_API_URL ? 'khoj' : 'openai'

if (!KHOJ_API_URL && !OPENAI_API_KEY) {
    console.error('Error: Set KHOJ_API_URL or OPENAI_API_KEY in your .env file')
    process.exit(1)
}
