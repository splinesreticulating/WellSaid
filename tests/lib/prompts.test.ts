import { khojPrompt, openAiPrompt, systemContext } from '$lib/prompts'
import type { ChatMessage } from '$lib/types'
import { describe, expect, it, vi } from 'vitest'

// Mock the environment variable
vi.mock('$env/static/private', () => ({
    CUSTOM_CONTEXT: 'Test custom context for prompts',
}))

describe('prompts', () => {
    describe('PERMANENT_CONTEXT', () => {
        it('should include custom context and instructions', () => {
            expect(systemContext).toContain('Test custom context for prompts')
            expect(systemContext).toContain('mimic my vocabulary and tone when suggesting replies')
        })
    })

    describe('openAiPrompt', () => {
        it('should generate prompt with tone and no context', () => {
            const result = openAiPrompt('gentle', '')

            expect(result).toContain('Given the conversation above')
            expect(result).toContain('Suggest 3 gentle replies')
            expect(result).toContain('one short reply, one medium-length reply, and one long reply')
            expect(result).not.toContain('Recent conversation context')
        })

        it('should generate prompt with tone and context', () => {
            const context = 'Previous conversation about weekend plans'
            const result = openAiPrompt('professional', context)

            expect(result).toContain('Suggest 3 professional replies')
            expect(result).toContain('Recent conversation context (for reference only):')
            expect(result).toContain(context)
        })

        it('should handle different tone types', () => {
            const tones = ['gentle', 'professional', 'reassuring', 'formal']

            tones.forEach((tone) => {
                const result = openAiPrompt(tone, '')
                expect(result).toContain(`Suggest 3 ${tone} replies`)
            })
        })
    })

    describe('khojPrompt', () => {
        const mockConversation: ChatMessage[] = [
            { sender: 'me', content: 'Hey, how was your day?' },
            { sender: 'partner', content: 'It was great! How about yours?' },
            { sender: 'me', content: 'Pretty good, thanks for asking' },
        ]

        it('should generate complete prompt with conversation and no context', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            expect(result).toContain(systemContext)
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('Message 1: me: Hey, how was your day?')
            expect(result).toContain('Message 2: partner: It was great! How about yours?')
            expect(result).toContain('Message 3: me: Pretty good, thanks for asking')
            expect(result).toContain('Suggest 3 gentle replies')
            expect(result).not.toContain('Recent conversation context')
        })

        it('should generate complete prompt with conversation and context', () => {
            const context = 'They mentioned being stressed about work earlier'
            const result = khojPrompt(mockConversation, 'funny', context)

            expect(result).toContain(systemContext)
            expect(result).toContain('Message 1: me: Hey, how was your day?')
            expect(result).toContain('Suggest 3 funny replies')
            expect(result).toContain('Recent conversation context (for reference only):')
            expect(result).toContain(context)
        })

        it('should handle empty conversation', () => {
            const result = khojPrompt([], 'gentle', '')

            expect(result).toContain(systemContext)
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('Suggest 3 gentle replies')
            expect(result).not.toContain('Message 1:')
        })

        it('should handle single message conversation', () => {
            const singleMessage: ChatMessage[] = [{ sender: 'me', content: 'Hello there!' }]
            const result = khojPrompt(singleMessage, 'reassuring', '')

            expect(result).toContain('Message 1: me: Hello there!')
            expect(result).not.toContain('Message 2:')
        })

        it('should preserve message order and indexing', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            const message1Index = result.indexOf('Message 1: me: Hey, how was your day?')
            const message2Index = result.indexOf(
                'Message 2: partner: It was great! How about yours?'
            )
            const message3Index = result.indexOf('Message 3: me: Pretty good, thanks for asking')

            expect(message1Index).toBeLessThan(message2Index)
            expect(message2Index).toBeLessThan(message3Index)
        })
    })

    describe('prompt structure consistency', () => {
        it('should have consistent format sections in both functions', () => {
            const openAiResult = openAiPrompt('gentle', 'test context')
            const khojResult = khojPrompt(
                [{ sender: 'me', content: 'test' }],
                'gentle',
                'test context'
            )

            // khojPrompt should contain the format instructions
            const formatSection = 'Please respond using this format:'
            expect(khojResult).toContain(formatSection)

            // khojPrompt should contain the reply structure
            expect(khojResult).toContain('Reply 1: <short reply>')

            // openAiPrompt should not contain the format section
            expect(openAiResult).not.toContain(formatSection)
        })
    })
})
