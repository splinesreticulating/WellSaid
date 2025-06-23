<script lang="ts">
    import type { ActionData } from './$types'
    
    const { data, form } = $props<{
        data: { settings: { key: string; value: string; description: string }[] }
        form?: ActionData
    }>()
    
    // Use server response settings if available (after successful save), otherwise use initial data
    const currentSettings = (form?.success && form?.settings) ? form.settings : data.settings
</script>

<svelte:head>
    <title>Settings</title>
</svelte:head>

<main class="settings-page">
    <h1>Settings</h1>
    
    {#if form?.success}
        <div class="success-message">
            Settings saved successfully!
        </div>
    {/if}
    
    {#if form?.error}
        <div class="error-message">
            Error: {form.error}
        </div>
    {/if}
    
    <form method="POST">
        {#each currentSettings as setting}
            <div class="setting-row">
                <label for={setting.key}>{setting.key}</label>
                <input 
                    id={setting.key} 
                    name={setting.key} 
                    type="text" 
                    value={setting.value}
                />
                <p class="description">{setting.description}</p>
            </div>
        {/each}
        <button type="submit" class="save-button">
            Save Settings
        </button>
    </form>
    <a href="/">Back</a>
</main>

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
    .save-button {
        margin-top: 1rem;
    }
    a {
        display: inline-block;
        margin-top: 1rem;
    }
    .success-message {
        color: var(--green);
        margin-bottom: 1rem;
    }
    .error-message {
        color: var(--red);
        margin-bottom: 1rem;
    }
</style>
