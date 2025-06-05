export const PERMANENT_CONTEXT =
    'Act as my therapist suggesting replies to my partner. Messages with role "user" are from me, and messages with role "assistant" are from my partner. Analyze my messages to mimic my vocabulary and tone when suggesting replies.'

export const buildReplyPrompt = (tone: string, context: string): string => `
    Given the conversation above, provide a brief summary including the emotional tone, main topics, and any changes in mood.
    Suggest 3 replies that I might send.
    Tone: ${tone}
    ${context ? `Additional context: ${context}` : ''}
    Please respond using this format:
    Summary: <summary>
    Suggested replies:
    Reply 1: <reply>
    Reply 2: <reply>
    Reply 3: <reply>
`
