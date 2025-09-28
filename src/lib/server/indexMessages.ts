import { logger } from '$lib/logger'
import type { MessageEmbeddingInput } from '$lib/types'
import { getOpenAIClient } from './openai'
import { supabase } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const EMBEDDING_MODEL = 'text-embedding-3-small'

export const indexMessages = async (messages: MessageEmbeddingInput[]): Promise<void> => {
    if (!messages.length) {
        return
    }

    if (!supabase) {
        logger.debug('Supabase client unavailable; skipping message indexing')
        return
    }

    const client = getOpenAIClient()
    if (!client) {
        logger.debug('OpenAI client unavailable; skipping message indexing')
        return
    }

    const uniqueMessages = dedupeMessages(messages)
    if (!uniqueMessages.length) {
        return
    }

    try {
        const supabaseClient = supabase as SupabaseClient
        const messagesToEmbed = await filterExisting(supabaseClient, uniqueMessages)
        if (!messagesToEmbed.length) {
            logger.debug('No new messages to embed')
            return
        }

        const inputs = messagesToEmbed.map((msg) => msg.text)
        const embeddingResponse = await client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: inputs,
        })

        if (embeddingResponse.data.length !== messagesToEmbed.length) {
            logger.warn(
                {
                    expected: messagesToEmbed.length,
                    received: embeddingResponse.data.length,
                },
                'Mismatch between embeddings and messages'
            )
            return
        }

        const rows = messagesToEmbed.map((message, index) => ({
            message_id: message.message_id,
            thread_id: message.thread_id,
            ts: message.ts,
            sender: message.sender,
            text: message.text,
            embedding: embeddingResponse.data[index].embedding,
        }))

        const { error } = await supabaseClient.from('message_embeddings').upsert(rows, {
            onConflict: 'message_id',
        })

        if (error) {
            logger.error({ error }, 'Failed to upsert message embeddings')
        }
    } catch (error) {
        logger.error({ error }, 'Failed to index messages')
    }
}

const dedupeMessages = (messages: MessageEmbeddingInput[]) => {
    const seen = new Set<string>()

    return messages.filter((message) => {
        if (!message.message_id || !message.thread_id || !message.text.trim()) {
            return false
        }

        const key = `${message.thread_id}:${message.message_id}`
        if (seen.has(key)) {
            return false
        }

        seen.add(key)
        return true
    })
}

const filterExisting = async (
    client: SupabaseClient,
    messages: MessageEmbeddingInput[]
): Promise<MessageEmbeddingInput[]> => {
    const ids = messages.map((message) => message.message_id)

    const { data, error } = await client.from('message_embeddings').select('message_id').in('message_id', ids)

    if (error) {
        logger.error({ error }, 'Failed to fetch existing message embeddings')
        return messages
    }

    const existingIds = new Set((data || []).map((row) => row.message_id))
    return messages.filter((message) => !existingIds.has(message.message_id))
}

// TODO: Consider moving indexing into a background job for batch backfilling older history.
