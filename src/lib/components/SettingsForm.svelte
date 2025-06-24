<script lang="ts">
    import { enhance } from '$app/forms'
    export let settings: { key: string; value: string; description: string }[]

    // Group settings by provider/type
    $: settingsGroups = {
        general: formSettings.filter(setting => 
            ['HISTORY_LOOKBACK_HOURS', 'PARTNER_PHONE', 'CUSTOM_CONTEXT'].includes(setting.key)
        ),
        openai: formSettings.filter(setting => setting.key.startsWith('OPENAI_')),
        anthropic: formSettings.filter(setting => setting.key.startsWith('ANTHROPIC_')),
        grok: formSettings.filter(setting => setting.key.startsWith('GROK_')),
        other: formSettings.filter(setting => 
            !['HISTORY_LOOKBACK_HOURS', 'PARTNER_PHONE', 'CUSTOM_CONTEXT'].includes(setting.key) &&
            !setting.key.startsWith('OPENAI_') &&
            !setting.key.startsWith('ANTHROPIC_') &&
            !setting.key.startsWith('GROK_')
        )
    }

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

    // Create a local copy of settings to bind to the form
    $: formSettings = [...settings]
    
    const formatSectionTitle = (key: string): string => {
        return {
            general: 'General Settings',
            openai: 'OpenAI',
            anthropic: 'Anthropic',
            grok: 'Grok',
            other: 'Other Settings'
        }[key] || key
    }
</script>

<form method="POST" use:enhance class="settings-form">
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
                                    bind:value={setting.value}
                                    rows="4"
                                    class="context-textarea"
                                    placeholder={setting.description}
                                >{setting.value}</textarea>
                            {:else}
                                <input 
                                    id={setting.key} 
                                    name={setting.key} 
                                    type={setting.key.includes('KEY') ? 'password' : 'text'}
                                    bind:value={setting.value} 
                                    placeholder={setting.key.includes('KEY') ? '••••••••••••••••' : ''}
                                />
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    {/each}
    <div class="form-actions">
        <button type="submit" formaction="/settings" class="save">Save Settings</button>
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
        display: block;
        font-size: 0.8rem;
        color: var(--gray);
        font-weight: normal;
        margin: 0.25rem 0 0.5rem 0;
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
        background: var(--bg);
        color: var(--text);
        transition: border-color 0.2s, box-shadow 0.2s;
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
        text-align: right;
    }
    
    .save {
        background: var(--primary);
        color: var(--primary-contrast);
        border: none;
        border-radius: var(--border-radius);
        padding: 0.7rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.2s, transform 0.1s;
    }
    
    .save:hover {
        background: var(--primary-dark);
    }
    
    .save:active {
        transform: translateY(1px);
    }
</style>
