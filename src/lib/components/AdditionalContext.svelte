<script lang="ts">
// biome-ignore lint/style/useConst: Svelte 5 $props() pattern
let { additionalContext = $bindable(''), expanded = $bindable(false) } = $props()
</script>

<details class="context-details" bind:open={expanded}>
    <summary>add more context</summary>
    <textarea
        class="context-input"
        rows="4"
        bind:value={additionalContext}
        placeholder="anything else we should know about?"
    ></textarea>
</details>

<style>
    details.context-details {
        text-align: left;
        border: 1px solid var(--light);
        background-color: var(--white);
        border-radius: var(--border-radius);
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    details summary {
        cursor: pointer;
        font-weight: 500;
    }

    textarea.context-input {
        font-family: var(--label-font);
        width: 100%;
        margin-top: 0.75rem;
        padding: 0.75rem;
        border: 1px solid var(--light);
        border-radius: var(--border-radius);
        resize: vertical;
        min-height: 80px;
        color: var(--primary-dark);
    }    
</style>
