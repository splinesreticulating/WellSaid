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

export const formatMessages = (messages: Message[]): ChatMessage[] => {
    return messages.map((m) => ({
        role: m.sender === 'me' ? 'user' : 'assistant',
        content: m.text,
    }))
}

const cleanReplyText = (text: string): string => {
    return text
        .replace(/^\*+\s*/, '') // Remove leading asterisks and spaces
        .replace(/^"/, '') // Remove leading quote
        .replace(/"$/, '') // Remove trailing quote
        .trim()
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
