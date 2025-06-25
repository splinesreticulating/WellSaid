import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

let originalCwd: string
let tempDir: string
let config: typeof import('../../src/lib/config')

// Utility to clear the env mock object
async function resetEnv() {
    const { env } = await import('$env/dynamic/private')
    for (const key of Object.keys(env)) {
        delete env[key]
    }
}

describe('settings db', () => {
    beforeEach(async () => {
        vi.resetModules()
        await resetEnv()
        originalCwd = process.cwd()
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'settings-test-'))
        process.chdir(tempDir)
        const { env } = await import('$env/dynamic/private')
        env.OPENAI_API_KEY = 'default-key'
        config = await import('$lib/config')
    })

    afterEach(() => {
        process.chdir(originalCwd)
        fs.rmSync(tempDir, { recursive: true, force: true })
    })

    it('loads default settings from env', async () => {
        const settings = await config.getAllSettings()
        const record = settings.find((s) => s.key === 'OPENAI_API_KEY')
        expect(record?.value).toBe('default-key')
        expect(config.settings.OPENAI_API_KEY).toBe('default-key')
    })

    it('updates and reads settings', async () => {
        await config.updateSetting('TEST_KEY', 'foo')
        let rows = await config.getAllSettings()
        let row = rows.find((s) => s.key === 'TEST_KEY')
        expect(row?.value).toBe('foo')
        expect(config.settings.TEST_KEY).toBe('foo')

        await config.updateSetting('TEST_KEY', 'bar')
        rows = await config.getAllSettings()
        row = rows.find((s) => s.key === 'TEST_KEY')
        expect(row?.value).toBe('bar')
        expect(config.settings.TEST_KEY).toBe('bar')
    })
})
