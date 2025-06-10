import { khojPrompt, openAiPrompt, PERMANENT_CONTEXT } from '$lib/prompts'
import type { ChatMessage } from '$lib/types'
import { describe, expect, it, vi } from 'vitest'

// Mock the environment variable
vi.mock('$env/static/private', () => ({
    CUSTOM_CONTEXT: 'Test custom context for prompts',
}))

describe('prompts', () => {
    describe('PERMANENT_CONTEXT', () => {
        it('should include custom context and instructions', () => {
            expect(PERMANENT_CONTEXT).toContain('Test custom context for prompts')
            expect(PERMANENT_CONTEXT).toContain('Messages with role "user" are from me')
            expect(PERMANENT_CONTEXT).toContain(
                'Messages with role "assistant" are from my partner'
            )
            expect(PERMANENT_CONTEXT).toContain(
                'Analyze my messages to mimic my vocabulary and tone'
            )
        })
    })

    describe('openAiPrompt', () => {
        it('should generate prompt with tone and no context', () => {
            const result = openAiPrompt('gentle', '')

            expect(result).toContain('Given the conversation above')
            expect(result).toContain('Suggest 3 gentle replies')
            expect(result).toContain('one short reply, one medium-length reply, and one long reply')
            expect(result).toContain('Please respond using this format:')
            expect(result).toContain('Summary: <summary>')
            expect(result).toContain('Reply 1: <short reply>')
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
            { role: 'user', content: 'Hey, how was your day?' },
            { role: 'assistant', content: 'It was great! How about yours?' },
            { role: 'user', content: 'Pretty good, thanks for asking' },
        ]

        it('should generate complete prompt with conversation and no context', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            expect(result).toContain(PERMANENT_CONTEXT)
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('Message 1: user: Hey, how was your day?')
            expect(result).toContain('Message 2: assistant: It was great! How about yours?')
            expect(result).toContain('Message 3: user: Pretty good, thanks for asking')
            expect(result).toContain('Suggest 3 gentle replies')
            expect(result).not.toContain('Recent conversation context')
        })

        it('should generate complete prompt with conversation and context', () => {
            const context = 'They mentioned being stressed about work earlier'
            const result = khojPrompt(mockConversation, 'funny', context)

            expect(result).toContain(PERMANENT_CONTEXT)
            expect(result).toContain('Message 1: user: Hey, how was your day?')
            expect(result).toContain('Suggest 3 funny replies')
            expect(result).toContain('Recent conversation context (for reference only):')
            expect(result).toContain(context)
        })

        it('should handle empty conversation', () => {
            const result = khojPrompt([], 'gentle', '')

            expect(result).toContain(PERMANENT_CONTEXT)
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('Suggest 3 gentle replies')
            expect(result).not.toContain('Message 1:')
        })

        it('should handle single message conversation', () => {
            const singleMessage: ChatMessage[] = [{ role: 'user', content: 'Hello there!' }]
            const result = khojPrompt(singleMessage, 'reassuring', '')

            expect(result).toContain('Message 1: user: Hello there!')
            expect(result).not.toContain('Message 2:')
        })

        it('should preserve message order and indexing', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            const message1Index = result.indexOf('Message 1: user: Hey, how was your day?')
            const message2Index = result.indexOf(
                'Message 2: assistant: It was great! How about yours?'
            )
            const message3Index = result.indexOf('Message 3: user: Pretty good, thanks for asking')

            expect(message1Index).toBeLessThan(message2Index)
            expect(message2Index).toBeLessThan(message3Index)
        })
    })

    describe('prompt structure consistency', () => {
        it('should have consistent format sections in both functions', () => {
            const openAiResult = openAiPrompt('gentle', 'test context')
            const khojResult = khojPrompt(
                [{ role: 'user', content: 'test' }],
                'gentle',
                'test context'
            )

            // Both should contain the same format instructions
            const formatSection = 'Please respond using this format:'
            expect(openAiResult).toContain(formatSection)
            expect(khojResult).toContain(formatSection)

            // Both should contain the same reply structure
            expect(openAiResult).toContain('Reply 1: <short reply>')
            expect(khojResult).toContain('Reply 1: <short reply>')
        })
    })
})
