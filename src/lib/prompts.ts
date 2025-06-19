import { CUSTOM_CONTEXT } from '$env/static/private'
import type { Message, ToneType } from './types'
import { formatMessagesAsText } from './utils'

const coreContext = [
    'Analyze messages attributed to "me:" to mimic my vocabulary and tone when suggesting replies.',
    'Additional context about recent conversation history is provided below. Use this to understand the current situation and tone, but focus your reply on the most recent messages.',
    'Do not summarize the history - it is only for context.',
    'I will also provide a desired tone and may include extra context. Always incorporate that tone and context when crafting replies.',
].join('\n')

const instructions = [
    'Given the conversation above, provide a brief summary including the emotional tone, main topics, and any changes in mood.',
    'Suggest 3 replies that I might send. Provide one short reply, one medium-length reply, and one long reply.',
    'Always use this tone when drafting replies:',
].join('\n')

const responseFormat = [
    'Please respond using this format:',
    'Summary: <summary>',
    'Suggested replies:',
    'Reply 1: <short reply>',
    'Reply 2: <medium reply>',
    'Reply 3: <long reply>',
].join('\n')

export const systemContext = [CUSTOM_CONTEXT, coreContext].join('\n\n')

const buildPrompt = (tone: string, context: string): string => {
    const lines = [`${instructions} ${tone}`]
    if (context) lines.push(`Extra context: ${context}`)
    return lines.join('\n')
}

export const openAiPrompt = (tone: string, context: string): string => buildPrompt(tone, context)

export const khojPrompt = (messages: Message[], tone: ToneType, context: string): string =>
    [
        systemContext,
        'Here are some text messages between my partner and I:\n' + formatMessagesAsText(messages),
        buildPrompt(tone, context),
        responseFormat,
    ].join('\n')
