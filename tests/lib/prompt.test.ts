import { buildKhojPrompt, PERMANENT_CONTEXT } from '$lib/prompt'
import type { ChatMessage, ToneType } from '$lib/types'
import { describe, expect, it } from 'vitest'

describe('buildKhojPrompt', () => {
    const mockMessages: ChatMessage[] = [
        { role: 'user', content: 'Hey, how are you?' },
        { role: 'assistant', content: 'I am doing well, thanks!' }
    ]
    const tone: ToneType = 'gentle'
    const context = 'Previous conversation about weekend plans'

    it('should include PERMANENT_CONTEXT when provided', () => {
        const prompt = buildKhojPrompt(mockMessages, tone, context)

        expect(prompt).toContain(PERMANENT_CONTEXT)
        expect(prompt).toContain('Hey, how are you?')
        expect(prompt).toContain('I am doing well, thanks!')
        expect(prompt).toContain('gentle')
        expect(prompt).toContain(context)
    })

    it('should work without PERMANENT_CONTEXT', () => {
        const prompt = buildKhojPrompt(mockMessages, tone, context)

        expect(prompt).toContain('Hey, how are you?')
        expect(prompt).toContain('I am doing well, thanks!')
        expect(prompt).toContain('gentle')
        expect(prompt).toContain(context)
    })

    it('should format messages correctly', () => {
        const prompt = buildKhojPrompt(mockMessages, tone, context)

        expect(prompt).toContain('Message 1: Me: Hey, how are you?')
        expect(prompt).toContain('Message 2: Partner: I am doing well, thanks!')
    })
})
