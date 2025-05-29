import os from 'node:os'
import path from 'node:path'
import type { MessageRow } from '$lib/types'
import dotenv from 'dotenv'
import { open } from 'sqlite'
import sqlite3 from 'sqlite3'
import { logger } from './logger'

dotenv.config()

const CHAT_DB_PATH = path.join(os.homedir(), 'Library', 'Messages', 'chat.db')
const PARTNER_HANDLE_ID = process.env.PARTNER_PHONE

export const queryMessagesDb = async (startDate?: string, endDate?: string) => {
    if (!PARTNER_HANDLE_ID) {
        logger.warn('PARTNER_PHONE env var not set cannot fetch messages.')

        return { messages: [] }
    }

    const db = await open({ filename: CHAT_DB_PATH, driver: sqlite3.Database });
    const isoToAppleNs = (iso: string): number => {
        const appleEpoch = new Date('2001-01-01T00:00:00Z').getTime();
        const targetTime = new Date(iso).getTime();

        return (targetTime - appleEpoch) * 1000000;
    }

    let dateWhere = '';
    const params: (string | number)[] = [PARTNER_HANDLE_ID];

    if (startDate) {
        dateWhere += ' AND message.date >= ?';
        params.push(isoToAppleNs(startDate));
    }

    if (endDate) {
        dateWhere += ' AND message.date <= ?';
        params.push(isoToAppleNs(endDate));
    }

    const query = `
        SELECT
        datetime(message.date / 1000000000 + strftime('%s', '2001-01-01'), 'unixepoch') AS timestamp,
        message.text AS text,
        handle.id AS contact_id,
        message.handle_id,
        handle.ROWID as handle_rowid,
        message.is_from_me,
        message.account
        FROM message
        JOIN handle ON message.handle_id = handle.ROWID
        WHERE message.text IS NOT NULL
        AND handle.id = ?
        ${dateWhere}
        ORDER BY message.date DESC`

    let rows: MessageRow[] = [];

    try {
        try {
            rows = await db.all(query, params) as MessageRow[]
        } catch (error) {
            logger.error({ error }, 'Error querying messages database')
            return { messages: [] }
        }
    } finally {
        await db.close()
    }

    logger.info({ count: rows.length, handleId: PARTNER_HANDLE_ID }, '📨 Fetched messages')

    const formattedRows = rows
        .map((row: MessageRow) => ({
            sender: row.is_from_me
                ? 'me'
                : row.contact_id === PARTNER_HANDLE_ID
                    ? 'partner'
                    : 'unknown',
            text: row.text,
            timestamp: row.timestamp,
        }))
        .reverse()

    // Return empty array if all messages are from 'me'
    const hasPartnerMessages = formattedRows.some(msg => msg.sender !== 'me');

    return { messages: hasPartnerMessages ? formattedRows : [] };
}
