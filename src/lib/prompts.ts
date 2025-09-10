import { settings } from '$lib/config'
import type { Message, ToneType } from './types'
import { formatMessagesAsText } from './utils'

const coreContext = [
    'You will see a conversation where messages from me are marked "me:" and messages from my partner are marked with their name.',
    'Analyze my messages carefully to mimic my specific vocabulary, sentence structure, and communication style when suggesting replies.',
    'Additional context about recent conversation history is provided below. Use this to understand the current situation and tone, but focus your reply on the most recent messages.',
    'Do not summarize the history - it is only for context.',
    'I will also provide a desired tone and may include extra context. Always incorporate both when crafting replies.',
].join('\n')

const instructions = [
    'Given the conversation above, provide a brief summary of the current situation, emotional dynamics, and main topic.',
    'Then suggest 3 possible replies I might send, each with different lengths:',
    '- Short (1-2 sentences)',
    '- Medium (3-4 sentences)',
    '- Long (5+ sentences)',
    'For all replies, maintain the following tone:',
].join('\n')

const responseFormat = [
    'Format your response exactly as follows:',
    '',
    'Summary: [Brief 1-2 sentence summary of the current conversation state]',
    '',
    'Reply 1 (Short): [Your short suggestion]',
    '',
    'Reply 2 (Medium): [Your medium suggestion]',
    '',
    'Reply 3 (Long): [Your long suggestion]',
].join('\n')

export const systemContext = () =>
    [settings.CUSTOM_CONTEXT, coreContext].filter(Boolean).join('\n\n')

const buildPrompt = (tone: string, context: string): string => {
    const lines = [`${instructions} ${tone}`]
    if (context) {
        lines.push('', `Additional context to consider: ${context}`)
    }
    lines.push('', responseFormat)
    return lines.join('\n')
}

export const openAiPrompt = (tone: string, context: string): string => buildPrompt(tone, context)

export const khojPrompt = (messages: Message[], tone: ToneType, context: string): string =>
    [
        systemContext(),
        'Here are some text messages between my partner and I:\n' + formatMessagesAsText(messages),
        buildPrompt(tone, context),
    ].join('\n')

export const anthropicPrompt = (messages: Message[], tone: ToneType, context: string): string =>
    [
        systemContext(),
        'Here are some text messages between my partner and I:\n' + formatMessagesAsText(messages),
        buildPrompt(tone, context),
    ].join('\n')
