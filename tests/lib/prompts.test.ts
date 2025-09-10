import { khojPrompt, openAiPrompt, systemContext } from '$lib/prompts'
import type { Message } from '$lib/types'
import { describe, expect, it, vi } from 'vitest'

// Mock configuration setting
vi.mock('$lib/config', () => ({
    settings: { CUSTOM_CONTEXT: 'Test custom context for prompts' },
}))

describe('prompts', () => {
    describe('PERMANENT_CONTEXT', () => {
        it('should include custom context and instructions', () => {
            expect(systemContext()).toContain('Test custom context for prompts')
            expect(systemContext()).toContain(
                'mimic my specific vocabulary, sentence structure, and communication style when suggesting replies'
            )
        })
    })

    describe('openAiPrompt', () => {
        it('should generate prompt with tone and no context', () => {
            const result = openAiPrompt('gentle', '')

            expect(result).toContain('Given the conversation above, provide a brief summary')
            expect(result).toContain('Then suggest 3 possible replies I might send')
            expect(result).toContain('- Short (1-2 sentences)')
            expect(result).toContain('- Medium (3-4 sentences)')
            expect(result).toContain('- Long (5+ sentences)')
            expect(result).toContain('For all replies, maintain the following tone: gentle')
            expect(result).not.toContain('Additional context to consider:')
            expect(result).toContain('Summary:')
        })

        it('should generate prompt with tone and context', () => {
            const context = 'Previous conversation about weekend plans'
            const result = openAiPrompt('professional', context)

            expect(result).toContain('Given the conversation above, provide a brief summary')
            expect(result).toContain('Additional context to consider: ' + context)
            expect(result).toContain('For all replies, maintain the following tone: professional')
            expect(result).toContain('Summary:')
        })

        it('should handle different tone types', () => {
            const tones = ['gentle', 'professional', 'reassuring', 'formal']

            tones.forEach((tone) => {
                const result = openAiPrompt(tone, '')
                expect(result).toContain('Given the conversation above, provide a brief summary')
                expect(result).toContain('Then suggest 3 possible replies I might send')
                expect(result).toContain(`For all replies, maintain the following tone: ${tone}`)
            })
        })
    })

    describe('khojPrompt', () => {
        const mockConversation: Message[] = [
            { sender: 'me', text: 'Hey, how was your day?', timestamp: '1' },
            { sender: 'them', text: 'It was great! How about yours?', timestamp: '2' },
            { sender: 'me', text: 'Pretty good, thanks for asking', timestamp: '3' },
        ]

        it('should generate complete prompt with conversation and no context', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            expect(result).toContain(systemContext())
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('me: Hey, how was your day?')
            expect(result).toContain('them: It was great! How about yours?')
            expect(result).toContain('me: Pretty good, thanks for asking')
            expect(result).toContain('Given the conversation above, provide a brief summary')
            expect(result).toContain('Then suggest 3 possible replies I might send')
            expect(result).toContain('Summary:')
            expect(result).toContain('Reply 1 (Short):')
            expect(result).toContain('Reply 2 (Medium):')
            expect(result).toContain('Reply 3 (Long):')
            expect(result).not.toContain('Extra context:')
        })

        it('should generate complete prompt with conversation and context', () => {
            const context = 'They mentioned being stressed about work earlier'
            const result = khojPrompt(mockConversation, 'funny', context)

            expect(result).toContain(systemContext())
            expect(result).toContain('me: Hey, how was your day?')
            expect(result).toContain('Given the conversation above, provide a brief summary')
            expect(result).toContain('Additional context to consider: ' + context)
            expect(result).toContain('Summary:')
            expect(result).toContain('Reply 1 (Short):')
            expect(result).toContain('Reply 2 (Medium):')
            expect(result).toContain('Reply 3 (Long):')
        })

        it('should handle empty conversation', () => {
            const result = khojPrompt([], 'gentle', '')

            expect(result).toContain(systemContext())
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('Given the conversation above, provide a brief summary')
            expect(result).toContain('Then suggest 3 possible replies I might send')
            expect(result).toContain('Summary:')
            // Check that there are no actual message lines (empty conversation)
            expect(result).not.toContain('\nme: ')
            expect(result).not.toContain('\ncontact: ')
        })

        it('should handle single message conversation', () => {
            const singleMessage: Message[] = [
                { sender: 'me', text: 'Hello there!', timestamp: '1' },
            ]
            const result = khojPrompt(singleMessage, 'reassuring', '')

            expect(result).toContain('me: Hello there!')
            expect(result).toContain('Summary:')
            expect(result).toContain('Reply 1 (Short):')
            expect(result).toContain('Reply 2 (Medium):')
            expect(result).toContain('Reply 3 (Long):')
            expect(result).not.toContain('contact:')
        })

        it('should preserve message order and indexing', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            const message1Index = result.indexOf('me: Hey, how was your day?')
            const message2Index = result.indexOf('them: It was great! How about yours?')
            const message3Index = result.indexOf('me: Pretty good, thanks for asking')

            expect(message1Index).toBeLessThan(message2Index)
            expect(message2Index).toBeLessThan(message3Index)
        })
    })

    describe('prompt structure consistency', () => {
        it('should have consistent format sections in both functions', () => {
            const openAiResult = openAiPrompt('gentle', 'test context')
            const khojResult = khojPrompt(
                [{ sender: 'me', text: 'test', timestamp: '1' }],
                'gentle',
                'test context'
            )

            // Both should contain the core instructions
            expect(openAiResult).toContain('Given the conversation above')
            expect(khojResult).toContain('Given the conversation above')

            // Both should include the tone
            expect(openAiResult).toContain('gentle')
            expect(khojResult).toContain('gentle')

            // Only khojPrompt should include the full response format
            expect(khojResult).toContain('Summary:')
            expect(khojResult).toContain('Reply 1 (Short):')
            expect(khojResult).toContain('Reply 2 (Medium):')
            expect(khojResult).toContain('Reply 3 (Long):')

            // Both should include the context when provided
            expect(openAiResult).toContain('test context')
            expect(khojResult).toContain('test context')
        })
    })
})
