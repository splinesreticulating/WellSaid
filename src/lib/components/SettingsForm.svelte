<script lang="ts">
    import { enhance } from '$app/forms'

    let { settings, form = null } = $props<{
        settings: { key: string; value: string; description: string }[]
        form?: any
    }>()

    // Simple reactive state for form values
    let settingValues = $state<Record<string, string>>({})

    // Initialize form values once on mount
    $effect(() => {
        if (Object.keys(settingValues).length === 0) {
            const values: Record<string, string> = {}
            for (const setting of settings) {
                values[setting.key] = setting.value
            }
            settingValues = values
        }
    })

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

    input[name='HISTORY_LOOKBACK_HOURS'],
    input[id$='_TEMPERATURE'],
    input[id$='_TOP_P'],
    input[id$='_PENALTY'] {
        width: 70px;
        text-align: center;
        padding: 0.6rem 0.5rem;
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
        color: var(--primary-dark);
        border: none;
        border-radius: var(--border-radius);
        padding: 0.7rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition:
            background-color 0.2s,
            transform 0.1s;
    }

    .save:hover {
        background: var(--primary-dark);
        color: var(--white);
    }

    .save:active {
        transform: translateY(1px);
    }

    .status-message {
        font-size: 0.9rem;
        font-weight: 600;
    }

    .status-message.error {
        color: var(--error);
    }
</style>
