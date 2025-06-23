<script lang="ts">
    import { enhance } from '$app/forms'
    const { data } = $props<{ data: { settings: { key: string; value: string; description: string }[] } }>()
</script>

<svelte:head>
    <title>Settings</title>
</svelte:head>

<main class="settings-page">
    <h1>Settings</h1>
    <form method="POST" use:enhance>
        {#each data.settings as setting}
            <div class="setting-row">
                <label for={setting.key}>{setting.key}</label>
                <input id={setting.key} name={setting.key} type="text" value={setting.value} />
                <p class="description">{setting.description}</p>
            </div>
        {/each}
        <button type="submit" formaction="?/save" class="save">Save</button>
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
    .save {
        margin-top: 1rem;
    }
    a {
        display: inline-block;
        margin-top: 1rem;
    }
</style>
