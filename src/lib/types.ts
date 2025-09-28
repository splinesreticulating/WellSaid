export interface Message {
    sender: string
    text: string
    timestamp: string
}

export interface MessageRow {
    is_from_me: boolean
    text: string
    date: string
    contact_id?: string
    timestamp: string
    guid: string
}

export interface PageData {
    messages?: Message[]
    multiProvider: boolean
    defaultProvider: 'khoj' | 'openai' | 'anthropic' | 'grok'
}

export const TONES = ['gentle', 'funny', 'reassuring', 'concise'] as const
export type ToneType = (typeof TONES)[number]

export interface OpenAIChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface OpenAIConfig {
    model: string
    temperature: number
    topP?: number
    frequencyPenalty?: number
    presencePenalty?: number
    apiUrl: string
    apiKey?: string
}

export interface MessageEmbeddingInput {
    message_id: string
    thread_id: string
    ts: string
    sender: string
    text: string
}

export interface SimilarMessageSnippet {
    text: string
    ts: string
    sender: string
}
