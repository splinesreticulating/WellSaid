import {
    extractReplies,
    parseSummaryToHumanReadable,
    formatMessagesAsText,
    hasPartnerMessages,
    safeCompare,
} from '$lib/utils'
import { describe, expect, it } from 'vitest'

describe('parseSummaryToHumanReadable', () => {
    it('should extract summary from text with "Summary:" prefix', () => {
        const rawOutput = `Summary: This is a summary of the conversation.

Suggested replies:
Reply 1: First reply
Reply 2: Second reply`

        const result = parseSummaryToHumanReadable(rawOutput)
        expect(result).toBe('This is a summary of the conversation.')
    })

    it('should handle multiline summaries', () => {
        const rawOutput = `Summary:
This is a summary.
It spans multiple lines.
It has details about the conversation.

Suggested replies:
Reply 1: First reply`

        const result = parseSummaryToHumanReadable(rawOutput)
        expect(result).toBe(
            'This is a summary.\nIt spans multiple lines.\nIt has details about the conversation.'
        )
    })

    it('should return the original text if no summary pattern is found', () => {
        const rawOutput = `This doesn't have a summary prefix but is still valid text.

Reply 1: First reply`

        const result = parseSummaryToHumanReadable(rawOutput)
        expect(result).toBe(rawOutput)
    })

    it('should handle empty input', () => {
        const result = parseSummaryToHumanReadable('')
        expect(result).toBe('')
    })
})

describe('extractReplies', () => {
    it('parses replies with and without formatting', () => {
        const raw = `**Reply 1:** "First reply"
Reply 2: Second reply
Reply 3: *Third reply*`

        const replies = extractReplies(raw)

        expect(replies[0]).toBe('First reply')
        expect(replies[1]).toBe('Second reply')
        expect(replies[2]).toContain('Third reply')
    })
})

describe('formatMessagesAsText', () => {
    it('formats messages as text with sender labels', () => {
        const messages = [
            { sender: 'me', text: 'Hello', timestamp: '1' },
            { sender: 'partner', text: 'Hi there', timestamp: '2' },
        ]

        const formatted = formatMessagesAsText(messages)

        expect(formatted).toBe('me: Hello\npartner: Hi there')
    })

    it('handles empty message array', () => {
        const formatted = formatMessagesAsText([])
        expect(formatted).toBe('')
    })

    it('handles single message', () => {
        const messages = [{ sender: 'me', text: 'Hello world', timestamp: '1' }]
        const formatted = formatMessagesAsText(messages)
        expect(formatted).toBe('me: Hello world')
    })

    it('preserves message order', () => {
        const messages = [
            { sender: 'partner', text: 'First', timestamp: '1' },
            { sender: 'me', text: 'Second', timestamp: '2' },
            { sender: 'partner', text: 'Third', timestamp: '3' },
        ]

        const formatted = formatMessagesAsText(messages)
        expect(formatted).toBe('partner: First\nme: Second\npartner: Third')
    })
})

describe('hasPartnerMessages', () => {
    it('returns true when partner messages exist', () => {
        const messages = [
            { sender: 'me', text: 'Hello', timestamp: '1' },
            { sender: 'partner', text: 'Hi there', timestamp: '2' },
        ]

        expect(hasPartnerMessages(messages)).toBe(true)
    })

    it('returns false when only my messages exist', () => {
        const messages = [
            { sender: 'me', text: 'Hello', timestamp: '1' },
            { sender: 'me', text: 'How are you?', timestamp: '2' },
        ]

        expect(hasPartnerMessages(messages)).toBe(false)
    })

    it('returns false for empty array', () => {
        expect(hasPartnerMessages([])).toBe(false)
    })

    it('returns true when only partner messages exist', () => {
        const messages = [
            { sender: 'partner', text: 'Hello', timestamp: '1' },
            { sender: 'partner', text: 'How are you?', timestamp: '2' },
        ]

        expect(hasPartnerMessages(messages)).toBe(true)
    })
})

describe('safeCompare', () => {
    it('returns true for identical strings', () => {
        expect(safeCompare('hello', 'hello')).toBe(true)
    })

    it('returns false for different strings', () => {
        expect(safeCompare('hello', 'world')).toBe(false)
    })

    it('returns false for strings of different lengths', () => {
        expect(safeCompare('hello', 'hello world')).toBe(false)
    })

    it('returns true for empty strings', () => {
        expect(safeCompare('', '')).toBe(true)
    })

    it('returns false when one string is empty', () => {
        expect(safeCompare('hello', '')).toBe(false)
        expect(safeCompare('', 'hello')).toBe(false)
    })

    it('handles special characters correctly', () => {
        const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
        expect(safeCompare(special, special)).toBe(true)
        expect(safeCompare(special, special + 'x')).toBe(false)
    })
})
