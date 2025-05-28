import { buildReplyPrompt } from '$lib/prompts'
import type { Message } from '$lib/types'
import { parseSummaryToHumanReadable } from '$lib/utils'
import dotenv from 'dotenv'

dotenv.config()

const KHOJ_API_URL = process.env.KHOJ_API_URL || "http://localhost:42110/api/chat"

export const getSuggestedReplies = async (
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
                    : m.sender
        return `${tag}: ${m.text}`
    })

    const prompt = buildReplyPrompt(recentText, tone, context)

    try {
        const khojRes = await fetch(KHOJ_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                q: prompt,
                ...(process.env.KHOJ_AGENT
                    ? { agent: process.env.KHOJ_AGENT }
                    : {}),
            }),
        })
        if (!khojRes.ok) {
            let errorBody: string
            try {
                errorBody = await khojRes.text()
            } catch (e) {
                errorBody = '(could not read body)'
            }
            // Only log the status and the first 500 characters of the error body
            console.error(
                `Khoj API error: ${khojRes.status} - ${errorBody.slice(0, 500)}`,
            )
            throw new Error(`Khoj API error: ${khojRes.status}`)
        }
        const khojData = await khojRes.json()
        // Khoj returns { response: "..." }
        const rawOutput = khojData.response || ""
        // Extract summary as everything before the first reply
        const summary = parseSummaryToHumanReadable(rawOutput)
        // Extract replies using a more specific approach to avoid duplicates
        // First try to find markdown-formatted replies
        let replyMatches = [...rawOutput.matchAll(/\*\*Reply\s*(\d+):\*\*\s*(.*)/g)]
            .map(m => ({ index: Number.parseInt(m[1], 10), text: m[2] }));
            
        // If no markdown replies were found, try plain text format
        if (replyMatches.length === 0) {
            replyMatches = [...rawOutput.matchAll(/Reply\s*(\d+):\s*(.*)/g)]
                .map(m => ({ index: Number.parseInt(m[1], 10), text: m[2] }));
        }
        
        // Sort by reply number and extract unique replies
        const replies = replyMatches
            .sort((a, b) => a.index - b.index)
            .map(m => m.text
                .replace(/^\*+\s*/, "") // Remove leading asterisks and spaces
                .replace(/^"/, "") // Remove leading quote
                .replace(/"$/, "") // Remove trailing quote
                .trim()
            )
        return { summary, replies, messageCount: messages.length }
    } catch (err) {
        console.error('Error generating replies:', err)
        return {
            summary: '',
            replies: ['(Sorry, I had trouble generating a response.)'],
            messageCount: messages.length,
        }
    }
}
