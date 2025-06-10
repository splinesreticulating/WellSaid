import { CUSTOM_CONTEXT } from '$env/static/private'
import type { ChatMessage, ToneType } from './types'

export const PERMANENT_CONTEXT = `${CUSTOM_CONTEXT}\n\nMessages with role "user" are from me. Messages with role "assistant" are from my partner. Analyze my messages to mimic my vocabulary and tone when suggesting replies.\n\nAdditional context about recent conversation history is provided below. Use this to understand the current situation and tone, but focus your reply on the most recent messages. Do not summarize the history - it is only for context.`

export const buildReplyPrompt = (tone: string, context: string): string => `
    Given the conversation above, provide a brief summary including the emotional tone, main topics, and any changes in mood.
    Suggest 3 ${tone} replies that I might send. Provide one short reply, one medium-length reply, and one long reply.
    ${context ? `Recent conversation context (for reference only):\n${context}\n` : ''}
    Please respond using this format:
    Summary: <summary>
    Suggested replies:
    Reply 1: <short reply>
    Reply 2: <medium reply>
    Reply 3: <long reply>
`

export const buildKhojPrompt = (
    conversation: ChatMessage[],
    tone: ToneType,
    context: string
): string => {
    const formattedMessages = conversation
        .map((msg, idx) => {
            const tag = msg.role === 'user' ? 'Me' : 'Partner'
            return `Message ${idx + 1}: ${tag}: ${msg.content}`
        })
        .join('\n')

    return `
        Here are some text messages between my partner and I:
        ${formattedMessages}
        
        Please give a brief summary, including the emotional tone, main topics, and any changes in mood.
        Suggest 3 replies that I might send. Provide one short reply, one medium-length reply, and one long reply. Focus on the most recent messages when crafting replies.
        
        Tone: ${tone}
        ${context ? `Recent conversation context (for reference only):\n${context}\n` : ''}
        
        Please respond using this format:
        Summary: <summary>
        Suggested replies:
        Reply 1: <short reply>
        Reply 2: <medium reply>
        Reply 3: <long reply>
    `
}
