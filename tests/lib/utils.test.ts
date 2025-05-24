import { describe, it, expect } from 'vitest';
import { parseSummaryToHumanReadable } from '../../src/lib/utils';

describe('parseSummaryToHumanReadable', () => {
  it('should extract summary from text with "Summary:" prefix', () => {
    const rawOutput = `Summary: This is a summary of the conversation.

Suggested replies:
Reply 1: First reply
Reply 2: Second reply`;

    const result = parseSummaryToHumanReadable(rawOutput);
    expect(result).toBe('This is a summary of the conversation.');
  });

  it('should handle multiline summaries', () => {
    const rawOutput = `Summary:
This is a summary.
It spans multiple lines.
It has details about the conversation.

Suggested replies:
Reply 1: First reply`;

    const result = parseSummaryToHumanReadable(rawOutput);
    expect(result).toBe('This is a summary.\nIt spans multiple lines.\nIt has details about the conversation.');
  });

  it('should return the original text if no summary pattern is found', () => {
    const rawOutput = `This doesn't have a summary prefix but is still valid text.

Reply 1: First reply`;

    const result = parseSummaryToHumanReadable(rawOutput);
    expect(result).toBe(rawOutput);
  });

  it('should handle empty input', () => {
    const result = parseSummaryToHumanReadable('');
    expect(result).toBe('');
  });
});
