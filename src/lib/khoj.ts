import { buildReplyPrompt } from '$lib/prompts';
import type { Message } from '$lib/types';
import { parseSummaryToHumanReadable } from '$lib/utils';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const khojApiUrl = process.env.KHOJ_API_URL || 'http://127.0.0.1:8000/api/chat';

export const getKhojReply = async (
  messages: Message[],
  tone: string,
  context: string,
): Promise<{ summary: string; replies: string[]; messageCount: number }> => {
  const recentText = messages.map((m) => {
    const tag =
      m.sender === 'me'
        ? 'Me'
        : m.sender === 'partner'
          ? 'Partner'
          : m.sender;
    return `${tag}: ${m.text}`;
  });

  const prompt = buildReplyPrompt(recentText, tone, context);

  try {
    const khojRes = await fetch(khojApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: prompt,
        ...(process.env.KHOJ_AGENT ? { agent: process.env.KHOJ_AGENT } : {}),
      }),
    });

    if (!khojRes.ok) {
      let errorBody: unknown = null;
      try {
        errorBody = await khojRes.json().catch(() => null);
      } catch (e) {
        errorBody = '(could not read body)';
      }
      logger.error({ status: khojRes.status, errorBody }, 'Error from Khoj API');
      throw new Error(`Khoj API returned ${khojRes.status}`);
    }

    const data = await khojRes.json();
    const rawOutput = data.response || '';
    const summary = parseSummaryToHumanReadable(rawOutput);

    let replyMatches = [...rawOutput.matchAll(/\*\*Reply\s*(\d+):\*\*\s*(.*)/g)].map((m) => ({
      index: Number.parseInt(m[1], 10),
      text: m[2],
    }));

    if (replyMatches.length === 0) {
      replyMatches = [...rawOutput.matchAll(/Reply\s*(\d+):\s*(.*)/g)].map((m) => ({
        index: Number.parseInt(m[1], 10),
        text: m[2],
      }));
    }

    const replies = replyMatches
      .sort((a, b) => a.index - b.index)
      .map((m) =>
        m.text
          .replace(/^\*+\s*/, '')
          .replace(/^"/, '')
          .replace(/"$/, '')
          .trim()
      );

    return { summary, replies, messageCount: messages.length };
  } catch (err: unknown) {
    let errorMessage = 'An unknown error occurred during Khoj reply retrieval';
    let errorStack: string | undefined = undefined;
    if (err instanceof Error) {
        errorMessage = err.message;
        errorStack = err.stack;
    } else if (typeof err === 'string') {
        errorMessage = err;
    } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        errorMessage = err.message;
        if ('stack' in err && typeof err.stack === 'string') {
            errorStack = err.stack;
        }
    }
    logger.error({ error: errorMessage, stack: errorStack }, 'Failed to get Khoj reply');
    return {
      summary: '',
      replies: ['(Sorry, I had trouble generating a response.)'],
      messageCount: messages.length,
    };
  }
}
