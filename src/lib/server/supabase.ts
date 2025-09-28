import { env } from '$env/dynamic/private'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { logger } from '$lib/logger'

const supabaseUrl = env.SUPABASE_URL
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

let client: SupabaseClient | null = null

if (!supabaseUrl || !supabaseServiceRoleKey) {
    logger.warn('Supabase environment variables missing; semantic recall disabled')
} else {
    client = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

export const supabase = client
