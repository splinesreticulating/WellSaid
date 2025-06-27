<script lang="ts">
    import { enhance } from '$app/forms'

    let { settings, form = null } = $props<{
        settings: { key: string; value: string; description: string }[]
        form?: any
    }>()

    // Initialize form values from props
    let settingValues = $state<Record<string, string>>(
        Object.fromEntries(settings.map((s: { key: string; value: string }) => [s.key, s.value]))
    )

    const rangeSettings: Record<string, { min: number; max: number; step?: number }> = {
        HISTORY_LOOKBACK_HOURS: { min: 0, max: 48, step: 1 },
        OPENAI_TEMPERATURE: { min: 0, max: 1, step: 0.1 },
        OPENAI_TOP_P: { min: 0, max: 1, step: 0.05 },
        OPENAI_FREQUENCY_PENALTY: { min: -2, max: 2, step: 0.1 },
        OPENAI_PRESENCE_PENALTY: { min: -2, max: 2, step: 0.1 },
        ANTHROPIC_TEMPERATURE: { min: 0, max: 1, step: 0.1 },
        GROK_TEMPERATURE: { min: 0, max: 1, step: 0.1 },
    }

    // Update form values when settings change
    $effect(() => {
        if (form?.settings) {
            settingValues = Object.fromEntries(
                form.settings.map((s: { key: string; value: string }) => [s.key, s.value])
            )
        }
    })

    // Handle range input changes
    function handleRangeChange(key: string, value: string) {
        const num = parseFloat(value)
        const range = rangeSettings[key]
        if (!isNaN(num) && num >= range.min && num <= range.max) {
            settingValues = { ...settingValues, [key]: value }
        }
    }

    // Group settings by provider
    const settingsGroups = $derived({
        general: settings.filter((s: { key: string; value: string; description: string }) =>
            ['HISTORY_LOOKBACK_HOURS', 'PARTNER_PHONE', 'CUSTOM_CONTEXT'].includes(s.key)
        ),
        khoj: settings.filter((s: { key: string; value: string; description: string }) =>
            s.key.startsWith('KHOJ_')
        ),
        openai: settings.filter((s: { key: string; value: string; description: string }) =>
            s.key.startsWith('OPENAI_')
        ),
        anthropic: settings.filter((s: { key: string; value: string; description: string }) =>
            s.key.startsWith('ANTHROPIC_')
        ),
        grok: settings.filter((s: { key: string; value: string; description: string }) =>
            s.key.startsWith('GROK_')
        ),
    })

    // Helper functions
    const formatLabel = (key: string): string => {
        const cleanKey = key
            .replace(/^(OPENAI|ANTHROPIC|GROK|KHOJ)_/, '')
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        return cleanKey === 'Api Key' ? 'API Key' : cleanKey
    }

    const getSectionTitle = (section: string): string => {
        const titles: Record<string, string> = {
            general: 'General',
            openai: 'OpenAI',
            anthropic: 'Anthropic',
            grok: 'Grok',
            khoj: 'Khoj',
        }
        return titles[section] || section
    }

    // Auto-hide success/error messages after 3 seconds
    let showMessage = $state(false)
    let messageTimeout: ReturnType<typeof setTimeout> | undefined

    $effect(() => {
        if (form?.success || form?.error) {
            showMessage = true
            if (messageTimeout) clearTimeout(messageTimeout)
            messageTimeout = setTimeout(() => (showMessage = false), 3000)
        }
        return () => messageTimeout && clearTimeout(messageTimeout)
    })
</script>

<form
    method="POST"
    use:enhance={() => {
        return async ({ update }) => {
            await update({ reset: false })
        }
    }}
    class="settings-form"
>
    {#each Object.entries(settingsGroups) as [section, sectionSettings], index}
        {#if sectionSettings.length > 0}
            {#if index > 0}
                <hr />
            {/if}
            <div class="settings-section">
                <h3 class="section-title">{getSectionTitle(section)}</h3>
                <div class="section-content">
                    {#each sectionSettings as setting}
                        <div class="setting-row">
                            <label for={setting.key} class="setting-label">
                                {formatLabel(setting.key)}
                                <span class="description">{setting.description}</span>
                            </label>
                            {#if setting.key === 'CUSTOM_CONTEXT'}
                                <textarea
                                    id={setting.key}
                                    name={setting.key}
                                    bind:value={settingValues[setting.key]}
                                    rows="4"
                                    class="context-textarea"
                                ></textarea>
                            {:else if rangeSettings[setting.key]}
                                <div class="range-wrapper">
                                    <input
                                        id={setting.key}
                                        name={setting.key}
                                        type="range"
                                        min={rangeSettings[setting.key].min}
                                        max={rangeSettings[setting.key].max}
                                        step={rangeSettings[setting.key].step ?? 1}
                                        bind:value={settingValues[setting.key]}
                                        class="range-input"
                                    />
                                    <span class="range-value">
                                        {settingValues[setting.key] || '0'}
                                    </span>
                                </div>
                            {:else}
                                <input
                                    id={setting.key}
                                    name={setting.key}
                                    type={setting.key.includes('KEY') ? 'password' : 'text'}
                                    bind:value={settingValues[setting.key]}
                                    placeholder={''}
                                />
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}

    <div class="form-actions">
        <button type="submit" formaction="?/settings" class="save">Update</button>
        {#if showMessage}
            {#if form?.success}
                <span class="status-message success">✓ Updated</span>
            {:else if form?.error}
                <span class="status-message error">✗ {form.error}</span>
            {/if}
        {/if}
    </div>
</form>

<style>
    .settings-section {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    .section-title {
        background: var(--primary);
        color: var(--primary-contrast);
        margin: 0;
        margin-top: 1rem;
        font-size: 1rem;
        font-weight: 600;
    }

    .section-content {
        padding: 1rem;
    }

    .setting-row {
        margin-bottom: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .setting-label {
        font-weight: 600;
        display: block;
        margin-bottom: 0.25rem;
    }

    .description {
        font-family: 'Inter', sans-serif;
        display: block;
        font-size: 0.8rem;
        color: var(--gray);
        font-weight: normal;
        line-height: 1.4;
    }

    input,
    textarea {
        border: 1px solid var(--light);
        border-radius: var(--border-radius);
        padding: 0.6rem 0.8rem;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 0.95rem;
        width: 100%;
        color: var(--text);
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    input:focus,
    textarea:focus {
        outline: none;
        border-color: var(--primary-dark);
        box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
    }

    textarea {
        min-height: 120px;
        resize: vertical;
        line-height: 1.5;
    }

    /* Specific field widths */
    input[name='PARTNER_PHONE'] {
        width: 200px;
    }

    input[type='text'][name='HISTORY_LOOKBACK_HOURS'],
    input[type='text'][id$='_TEMPERATURE'],
    input[type='text'][id$='_TOP_P'],
    input[type='text'][id$='_PENALTY'] {
        width: 70px;
        text-align: center;
        padding: 0.6rem 0.5rem;
    }

    .range-wrapper {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .range-input {
        width: 200px;
        padding: 8px 0;
        margin: 0;
    }

    .range-value {
        display: inline-block;
        min-width: 30px;
        text-align: center;
        font-family: monospace;
        font-size: 1.3em;
        margin-left: 10px;
        color: var(--text);
    }

    input[name='OPENAI_MODEL'],
    input[name='ANTHROPIC_MODEL'],
    input[name='GROK_MODEL'] {
        width: 300px;
    }

    .form-actions {
        margin-top: 1.5rem;
        display: flex;
        align-items: center;
        gap: 1rem;
    }

    .save {
        padding: 0.7rem 1.5rem;
        background-color: var(--primary-dark);
        color: var(--white);
        border: 1px solid var(--primary-light);
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: 500;
        transition:
            background-color 0.2s,
            transform 0.1s;
        min-height: var(--min-touch-size);
        min-width: var(--min-touch-size);
        display: flex;
        align-items: center;
    }

    .save:hover {
        background-color: var(--primary-dark);
    }

    .save:active {
        transform: scale(0.98);
    }

    .save:disabled {
        background-color: var(--light);
        color: var(--gray);
        cursor: not-allowed;
        border-color: var(--light);
    }

    .status-message {
        font-size: 0.9rem;
        font-weight: 600;
    }

    .status-message.error {
        color: var(--error);
    }
</style>
