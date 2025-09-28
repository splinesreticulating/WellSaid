import { settings } from '$lib/config'
import type { Message, MessageEmbeddingInput, MessageRow } from '$lib/types'
import os from 'node:os'
import path from 'node:path'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { logger } from './logger'
import { hasContactMessages, isoToAppleNanoseconds } from './utils'

const CHAT_DB_PATH = path.join(os.homedir(), 'Library', 'Messages', 'chat.db')

const buildQuery = (startDate: string, endDate: string) => {
    logger.debug({ startDate, endDate }, 'Getting messages')
    const params = [
        settings.CONTACT_PHONE,
        isoToAppleNanoseconds(startDate),
        isoToAppleNanoseconds(endDate),
    ]

    const query = `
        SELECT
            datetime(message.date / 1000000000 + strftime('%s', '2001-01-01'), 'unixepoch') AS timestamp,
            message.text AS text,
            handle.id AS contact_id,
            message.is_from_me,
            message.guid AS guid
        FROM message
        JOIN handle ON message.handle_id = handle.ROWID
        WHERE message.text IS NOT NULL
            AND handle.id = ?
            AND message.date >= ?
            AND message.date <= ?
        ORDER BY message.date DESC`

    return { query, params }
}

const formatMessages = (rows: MessageRow[]) => {
    return rows
        .map((row) => ({
            sender: row.is_from_me
                ? 'me'
                : row.contact_id === settings.CONTACT_PHONE
                  ? 'them'
                  : 'unknown',
            text: row.text,
            timestamp: new Date(
                row.timestamp.endsWith('Z') ? row.timestamp : `${row.timestamp}Z`
            ).toISOString(),
        }))
        .reverse() // Reverse to get chronological order
}

const mapEmbeddableMessages = (rows: MessageRow[]): MessageEmbeddingInput[] => {
    return rows.map((row) => ({
        message_id: row.guid,
        thread_id: row.contact_id ?? settings.CONTACT_PHONE ?? 'unknown',
        ts: new Date(row.timestamp.endsWith('Z') ? row.timestamp : `${row.timestamp}Z`).toISOString(),
        sender: row.is_from_me
            ? 'me'
            : row.contact_id === settings.CONTACT_PHONE
              ? 'them'
              : row.contact_id || 'unknown',
        text: row.text || '',
    }))
}

export const queryMessagesDb = async (
    startDate: string,
    endDate: string
): Promise<{ messages: Message[]; embeddableMessages: MessageEmbeddingInput[] }> => {
    if (!settings.CONTACT_PHONE) {
        logger.warn('CONTACT_PHONE setting not configured')
        return { messages: [], embeddableMessages: [] }
    }

    const db = await open({ filename: CHAT_DB_PATH, driver: sqlite3.Database })
    const { query, params } = buildQuery(startDate, endDate)

    try {
        const rows = (await db.all(query, params)) as MessageRow[]
        logger.info({ count: rows.length, handleId: settings.CONTACT_PHONE }, 'Fetched messages')

        const formattedMessages = formatMessages(rows)
        const embeddableMessages = mapEmbeddableMessages(rows)

        // Return empty array if there are no messages from the contact
        return {
            messages: hasContactMessages(formattedMessages) ? formattedMessages : [],
            embeddableMessages,
        }
    } catch (error) {
        logger.error({ error }, 'Error querying messages database')
        return { messages: [], embeddableMessages: [] }
    } finally {
        await db.close()
    }
}
