import { khojPrompt, openAiPrompt, systemContext } from '$lib/prompts'
import type { Message } from '$lib/types'
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
            expect(result).toContain('Suggest 3 replies that I might send')
            expect(result).toContain('one short reply, one medium-length reply, and one long reply')
            expect(result).toContain('Always use this tone when drafting replies: gentle')
            expect(result).not.toContain('Extra context:')
            expect(result).not.toContain('Summary:')
            expect(result).not.toContain('Suggested replies:')
        })

        it('should generate prompt with tone and context', () => {
            const context = 'Previous conversation about weekend plans'
            const result = openAiPrompt('professional', context)

            expect(result).toContain('Suggest 3 replies that I might send')
            expect(result).toContain('Extra context: ' + context)
            expect(result).toContain('Always use this tone when drafting replies: professional')
            expect(result).not.toContain('Summary:')
            expect(result).not.toContain('Suggested replies:')
        })

        it('should handle different tone types', () => {
            const tones = ['gentle', 'professional', 'reassuring', 'formal']

            tones.forEach((tone) => {
                const result = openAiPrompt(tone, '')
                expect(result).toContain('Suggest 3 replies that I might send')
                expect(result).toContain(`brief summary including the emotional tone`)
                expect(result).toContain(`Always use this tone when drafting replies: ${tone}`)
            })
        })
    })

    describe('khojPrompt', () => {
        const mockConversation: Message[] = [
            { sender: 'me', text: 'Hey, how was your day?', timestamp: '1' },
            { sender: 'partner', text: 'It was great! How about yours?', timestamp: '2' },
            { sender: 'me', text: 'Pretty good, thanks for asking', timestamp: '3' },
        ]

        it('should generate complete prompt with conversation and no context', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            expect(result).toContain(systemContext)
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('me: Hey, how was your day?')
            expect(result).toContain('partner: It was great! How about yours?')
            expect(result).toContain('me: Pretty good, thanks for asking')
            expect(result).toContain('Suggest 3 replies that I might send')
            expect(result).toContain('Summary:')
            expect(result).toContain('Suggested replies:')
            expect(result).toContain('Reply 1:')
            expect(result).toContain('Reply 2:')
            expect(result).toContain('Reply 3:')
            expect(result).not.toContain('Extra context:')
        })

        it('should generate complete prompt with conversation and context', () => {
            const context = 'They mentioned being stressed about work earlier'
            const result = khojPrompt(mockConversation, 'funny', context)

            expect(result).toContain(systemContext)
            expect(result).toContain('me: Hey, how was your day?')
            expect(result).toContain('Suggest 3 replies that I might send')
            expect(result).toContain('Extra context: ' + context)
            expect(result).toContain('Summary:')
            expect(result).toContain('Suggested replies:')
            expect(result).toContain('Reply 1:')
            expect(result).toContain('Reply 2:')
            expect(result).toContain('Reply 3:')
        })

        it('should handle empty conversation', () => {
            const result = khojPrompt([], 'gentle', '')

            expect(result).toContain(systemContext)
            expect(result).toContain('Here are some text messages between my partner and I:')
            expect(result).toContain('Suggest 3 replies that I might send')
            expect(result).toContain('Summary:')
            expect(result).toContain('Suggested replies:')
            // Check that there are no actual message lines (empty conversation)
            expect(result).not.toContain('\nme: ')
            expect(result).not.toContain('\npartner: ')
        })

        it('should handle single message conversation', () => {
            const singleMessage: Message[] = [{ sender: 'me', text: 'Hello there!', timestamp: '1' }]
            const result = khojPrompt(singleMessage, 'reassuring', '')

            expect(result).toContain('me: Hello there!')
            expect(result).toContain('Summary:')
            expect(result).toContain('Suggested replies:')
            expect(result).toContain('Reply 1:')
            expect(result).toContain('Reply 2:')
            expect(result).toContain('Reply 3:')
            expect(result).not.toContain('partner:')
        })

        it('should preserve message order and indexing', () => {
            const result = khojPrompt(mockConversation, 'gentle', '')

            const message1Index = result.indexOf('me: Hey, how was your day?')
            const message2Index = result.indexOf('partner: It was great! How about yours?')
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
            expect(khojResult).toContain('Suggested replies:')
            expect(khojResult).toContain('Reply 1:')
            expect(khojResult).toContain('Reply 2:')
            expect(khojResult).toContain('Reply 3:')

            // Both should include the context when provided
            expect(openAiResult).toContain('test context')
            expect(khojResult).toContain('test context')
        })
    })
})
