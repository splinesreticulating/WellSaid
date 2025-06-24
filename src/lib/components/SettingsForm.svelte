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
            <input id={setting.key} name={setting.key} type="text" bind:value={setting.value} />
            <p class="description">{setting.description}</p>
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
    .description {
        font-size: 0.8rem;
        color: var(--gray);
        margin-top: 0.25rem;
    }
    .save {
        margin-top: 1rem;
    }
</style>
