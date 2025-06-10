<script lang="ts">
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
    {#if additionalContext.trim() !== ''}
        <div class="button-container">
            <button
                type="button"
                class="clear-button"
                onclick={() => {
                    additionalContext = ''
                }}
            >
                clear
            </button>
        </div>
    {/if}
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

    .clear-button {
        border: none;
        background-color: var(--light);
        color: var(--primary-dark);
        border-radius: var(--border-radius);
        padding: 0.25rem 0.75rem;
        cursor: pointer;
    }

    .clear-button:hover {
        background-color: var(--primary-dark);
        color: var(--white);
    }

    .button-container {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.5rem;
    }
</style>
