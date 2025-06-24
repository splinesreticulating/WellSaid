<script lang="ts">
    import { enhance } from '$app/forms'

    let { settings: initialSettings, form = null } = $props<{
        settings: { key: string; value: string; description: string }[]
        form?: any
    }>()

    // Create reactive state for settings
    let settingsState = $state({
        settings: [...initialSettings],
        lastUpdated: Date.now()
    });

    // Update settings when props change
    $effect(() => {
        if (form?.settings) {
            settingsState = {
                settings: [...form.settings],
                lastUpdated: Date.now()
            };
        } else if (initialSettings) {
            settingsState = {
                settings: [...initialSettings],
                lastUpdated: Date.now()
            };
        }
    });

    // Get current settings from state
    let currentSettings = $derived(settingsState.settings);

    // Helper function to handle bindings
    const getSettingValue = (key: string) => {
        return settingsState.settings.find(s => s.key === key)?.value || '';
    };

    const setSettingValue = (key: string, value: string) => {
        const index = settingsState.settings.findIndex(s => s.key === key);
        if (index !== -1) {
            const newSettings = [...settingsState.settings];
            newSettings[index] = { ...newSettings[index], value };
            settingsState = {
                settings: newSettings,
                lastUpdated: Date.now()
            };
        }
    };

    // Group settings by provider/type
    let settingsGroups = $derived({
        general: currentSettings.filter((setting: any) =>
            ['HISTORY_LOOKBACK_HOURS', 'PARTNER_PHONE', 'CUSTOM_CONTEXT'].includes(setting.key)
        ),
        khoj: currentSettings.filter((setting: any) => setting.key.startsWith('KHOJ_')),
        openai: currentSettings.filter((setting: any) => setting.key.startsWith('OPENAI_')),
        anthropic: currentSettings.filter((setting: any) => setting.key.startsWith('ANTHROPIC_')),
        grok: currentSettings.filter((setting: any) => setting.key.startsWith('GROK_')),
    })

    const envKeyToHumanReadable = (envKey: string): string => {
        // Convert SNAKE_CASE to Title Case and remove provider prefixes
        const cleanKey = envKey
            .replace(/^(OPENAI|ANTHROPIC|GROK)_/, '')
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        return cleanKey === 'Api Key' ? 'API Key' : cleanKey
    }

    const formatSectionTitle = (key: string): string => {
        return (
            {
                general: 'General',
                openai: 'OpenAI',
                anthropic: 'Anthropic',
                grok: 'Grok',
                khoj: 'Khoj',
            }[key] || key
        )
    }

    // Auto-hide messages after 3 seconds
    let showMessage = $state(false)
    let messageTimeout: ReturnType<typeof setTimeout> | undefined

    $effect(() => {
        if (form && (form.success || form.error)) {
            showMessage = true

            // Clear any existing timeout
            if (messageTimeout) {
                clearTimeout(messageTimeout)
            }

            // Set new timeout to hide message after 3 seconds
            messageTimeout = setTimeout(() => {
                showMessage = false
            }, 3000)
        }

        // Cleanup function
        return () => {
            if (messageTimeout) {
                clearTimeout(messageTimeout)
            }
        }
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
    {#each Object.entries(settingsGroups) as [section, sectionSettings]}
        {#if sectionSettings.length > 0}
            <div class="settings-section">
                <h3 class="section-title">{formatSectionTitle(section)}</h3>
                <div class="section-content">
                    {#each sectionSettings as setting}
                        <div class="setting-row">
                            <label for={setting.key} class="setting-label">
                                {envKeyToHumanReadable(setting.key)}
                                <span class="description">{setting.description}</span>
                            </label>
                            {#if setting.key === 'CUSTOM_CONTEXT'}
                                <textarea
                                    id={setting.key}
                                    name={setting.key}
                                    oninput={(e) => setSettingValue(setting.key, (e.target as HTMLTextAreaElement).value)}
                                    rows="4"
                                    class="context-textarea">{getSettingValue(setting.key)}</textarea
                                >
                            {:else}
                                <input
                                    id={setting.key}
                                    name={setting.key}
                                    type={setting.key.includes('KEY') ? 'password' : 'text'}
                                    value={getSettingValue(setting.key)}
                                    oninput={(e) => setSettingValue(setting.key, (e.target as HTMLInputElement).value)}
                                    placeholder={setting.key.includes('KEY')
                                        ? '••••••••••••••••'
                                        : ''}
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
        {#if showMessage && form.success}
            <span class="status-message success">✓ Updated</span>
        {:else if showMessage && form.error}
            <span class="status-message error">✗ {form.error}</span>
        {/if}
    </div>
</form>

<style>
    .settings-section {
        background: var(--bg-secondary);
        border-radius: var(--border-radius);
        margin-bottom: 1.5rem;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .section-title {
        background: var(--primary);
        color: var(--primary-contrast);
        margin: 0;
        padding: 0.75rem 1rem;
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
        border-color: var(--primary);
        box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.1);
    }

    textarea {
        min-height: 120px;
        resize: vertical;
        line-height: 1.5;
    }

    /* Make specific fields narrower */
    input[name='PARTNER_PHONE'] {
        width: 200px;
    }

    /* Numeric input fields */
    input[name='HISTORY_LOOKBACK_HOURS'],
    input[id$='_TEMPERATURE'],
    input[id$='_TOP_P'],
    input[id$='_PENALTY'] {
        width: 70px;
        text-align: center;
        padding: 0.6rem 0.5rem;
    }

    /* Model selection fields */
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
        color: var(--primary-contrast);
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
        color: var(--light);
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
