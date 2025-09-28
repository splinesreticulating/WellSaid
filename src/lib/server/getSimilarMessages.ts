import { logger } from '$lib/logger'
import type { SimilarMessageSnippet } from '$lib/types'
import { getOpenAIClient } from './openai'
import { supabase } from './supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

const EMBEDDING_MODEL = 'text-embedding-3-small'

export const getSimilarMessages = async (
    query: string,
    threadId: string,
    k = 5
): Promise<SimilarMessageSnippet[]> => {
    const trimmedQuery = query.trim()
    if (!trimmedQuery || !threadId) {
        return []
    }

    if (!supabase) {
        logger.debug('Supabase client unavailable; skipping semantic recall lookup')
        return []
    }

    const client = getOpenAIClient()
    if (!client) {
        logger.debug('OpenAI client unavailable; skipping semantic recall lookup')
        return []
    }

    try {
        const embeddingResponse = await client.embeddings.create({
            model: EMBEDDING_MODEL,
            input: trimmedQuery,
        })

        const queryEmbedding = embeddingResponse.data[0]?.embedding
        if (!queryEmbedding) {
            logger.warn('Failed to compute query embedding for semantic recall lookup')
            return []
        }

        const supabaseClient = supabase as SupabaseClient
        const { data, error } = await supabaseClient.rpc('match_message_embeddings', {
            query_embedding: queryEmbedding,
            thread_filter: threadId,
            match_count: k,
        })

        if (error) {
            logger.error({ error }, 'Failed to fetch similar messages from Supabase')
            return []
        }

        return (data || []).map((row) => ({
            text: row.text as string,
            ts: row.ts as string,
            sender: row.sender as string,
        }))
    } catch (error) {
        logger.error({ error }, 'Semantic recall lookup failed')
        return []
    }
}
