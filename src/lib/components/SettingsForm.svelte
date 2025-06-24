<script lang="ts">
    import { enhance } from '$app/forms'
    export let settings: { key: string; value: string; description: string }[]

    const envKeyToHumanReadable = (envKey: string): string => {
        // Convert SNAKE_CASE to Title Case
        return envKey
            .toLowerCase()
            .split('_')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    // Create a local copy of settings to bind to the form
    $: formSettings = [...settings]
</script>

<form method="POST" use:enhance class="settings-form">
    {#each formSettings as setting}
        <div class="setting-row">
            <label for={setting.key}>{envKeyToHumanReadable(setting.key)}</label>
            {#if setting.key === 'CUSTOM_CONTEXT'}
                <textarea
                    id={setting.key}
                    name={setting.key}
                    bind:value={setting.value}
                    rows="4"
                    class="context-textarea"
                    placeholder={setting.description}>{setting.value}</textarea
                >
            {:else}
                <input id={setting.key} name={setting.key} type="text" bind:value={setting.value} />
                <p class="description">{setting.description}</p>
            {/if}
        </div>
    {/each}
    <button type="submit" formaction="/settings" class="save">Save</button>
</form>

<style>
    .setting-row {
        margin-bottom: 1rem;
    }
    label {
        font-weight: bold;
        display: block;
    }
    input,
    textarea {
        border: 1px solid var(--light);
        border-radius: var(--border-radius);
        padding: 0.5rem;
        box-sizing: border-box;
        font-family: inherit;
        font-size: 1rem;
    }

    textarea {
        width: 100%;
        min-height: 100px;
        resize: vertical;
    }

    /* Make specific fields narrower */
    input[name='PARTNER_PHONE'] {
        width: 200px; /* For phone numbers */
    }

    input[name='HISTORY_LOOKBACK_HOURS'] {
        width: 60px; /* Only needs room for up to 3 digits */
        text-align: center;
    }
    .description {
        font-size: 0.8rem;
        color: var(--gray);
        margin-top: 0.25rem;
    }
    .save {
        margin-top: 1rem;
    }
</style>
