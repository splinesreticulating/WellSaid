import { timingSafeEqual } from 'node:crypto'
import type { ChatMessage, Message } from './types'

export const parseSummaryToHumanReadable = (rawOutput: string): string => {
    const summaryRegex = /Summary:[ \t]*(\n+)?([\s\S]*?)(?=\s*Suggested replies:|$)/
    const match = rawOutput.match(summaryRegex)

    if (!match) {
        return rawOutput
    }

    // Get the trimmed summary and remove any trailing '###'
    return match[2].trim().replace(/\s*###\s*$/, '')
}

export const hasPartnerMessages = (formattedRows: Message[]) =>
    formattedRows.some((msg) => msg.sender !== 'me')

export const formatAsUserAndAssistant = (messages: Message[]): ChatMessage[] => {
    return messages.map((m) => ({
        role: m.sender === 'me' ? 'user' : 'assistant',
        content: m.text,
    }))
}

const cleanReplyText = (text: string): string => {
    let cleaned = text.trim()

    // Remove leading asterisks and spaces
    while (cleaned.startsWith('*') || cleaned.startsWith(' ')) {
        cleaned = cleaned.slice(1)
    }

    // Remove leading quotes
    if (cleaned.startsWith('"') || cleaned.startsWith('"')) {
        cleaned = cleaned.slice(1)
    }

    // Remove trailing quotes
    if (cleaned.endsWith('"') || cleaned.endsWith('"')) {
        cleaned = cleaned.slice(0, -1)
    }

    return cleaned.trim()
}

export const extractReplies = (rawOutput: string): string[] => {
    const replyPattern = /\*\*Reply\s*\d:\*\*\s*(.*)|Reply\s*\d:\s*(.*)/g
    const replies = Array.from(rawOutput.matchAll(replyPattern))
        .map((m) => {
            const currentMatch = m as RegExpMatchArray
            return cleanReplyText(currentMatch[1] || currentMatch[2] || '')
        })
        .filter(Boolean)
    return replies
}

export const safeCompare = (a: string, b: string): boolean => {
    const len = Math.max(a.length, b.length)
    const aBuf = Buffer.alloc(len, 0)
    const bBuf = Buffer.alloc(len, 0)
    Buffer.from(a).copy(aBuf)
    Buffer.from(b).copy(bBuf)
    return timingSafeEqual(aBuf, bBuf) && a.length === b.length
}

export const formatMessages = (conversation: ChatMessage[]): string =>
    conversation.map((msg, idx) => `Message ${idx + 1}: ${msg.role}: ${msg.content}`).join('\n')
