<script lang="ts">
    import { enhance } from '$app/forms'
    export let settings: { key: string; value: string; description: string }[]
</script>

<form method="POST" use:enhance class="settings-form">
    {#each settings as setting}
        <div class="setting-row">
            <label for={setting.key}>{setting.key}</label>
            <input id={setting.key} name={setting.key} type="text" value={setting.value} />
            <p class="description">{setting.description}</p>
        </div>
    {/each}
    <button type="submit" formaction="/settings/save" class="save">Save</button>
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
