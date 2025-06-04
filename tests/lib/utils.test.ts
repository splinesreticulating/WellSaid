import { parseSummaryToHumanReadable, extractReplies, formatMessagesToRecentText } from '$lib/utils'
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
    expect(result).toBe('This is a summary.\nIt spans multiple lines.\nIt has details about the conversation.')
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

describe('formatMessagesToRecentText', () => {
  it('formats messages with the correct tags', () => {
    const messages = [
      { sender: 'me', text: 'Hello', timestamp: '1' },
      { sender: 'partner', text: 'Hi there', timestamp: '2' }
    ]

    const formatted = formatMessagesToRecentText(messages)

    expect(formatted).toEqual(['Me: Hello', 'Partner: Hi there'])
  })
})
