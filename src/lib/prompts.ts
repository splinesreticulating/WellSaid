import { CUSTOM_CONTEXT } from '$env/static/private'
import type { ChatMessage, ToneType } from './types'
import { formatMessages } from './utils'

export const systemContext = `${CUSTOM_CONTEXT}

Messages with role "user" are from me. Messages with role "assistant" are from my partner. Analyze my messages to mimic my vocabulary and tone when suggesting replies.

Additional context about recent conversation history is provided below. Use this to understand the current situation and tone, but focus your reply on the most recent messages. Do not summarize the history - it is only for context.`

const buildPrompt = (tone: string, context: string): string => {
    const contextSection = context
        ? `\nRecent conversation context (for reference only):\n${context}\n`
        : ''

    return `Given the conversation above, provide a brief summary including the emotional tone, main topics, and any changes in mood.
Suggest 3 ${tone} replies that I might send. Provide one short reply, one medium-length reply, and one long reply.
${contextSection}
`
}

export const openAiPrompt = (tone: string, context: string): string =>
    `\n${buildPrompt(tone, context)}\n`

export const khojPrompt = (
    conversation: ChatMessage[],
    tone: ToneType,
    context: string
): string => {
    return `
        ${systemContext}
        
        Here are some text messages between my partner and I:
        
        ${formatMessages(conversation)}
    
        ${buildPrompt(tone, context)}
        Please respond using this format:
        Summary: <summary>
        Suggested replies:
            Reply 1: <short reply>
            Reply 2: <medium reply>
            Reply 3: <long reply>
    `
}
