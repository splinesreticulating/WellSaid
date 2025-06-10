<script lang="ts">
    let { replies = [], loading = false }: { replies: string[]; loading: boolean } = $props()

    let copiedIndex = $state(-1)
</script>

{#snippet copyButton(textToCopy: string, currentIndex: number)}
    <button
        class="copy-button"
        onclick={async () => {
            try {
                await navigator.clipboard.writeText(textToCopy)
                copiedIndex = currentIndex // Update the component-level state
                setTimeout(() => {
                    // Only reset if this button is still the one marked 'copied'
                    if (copiedIndex === currentIndex) {
                        copiedIndex = -1
                    }
                }, 2000)
            } catch (err) {
                console.error('Failed to copy text: ', err)
            }
        }}
        aria-label="Copy to clipboard"
    >
        {#if copiedIndex === currentIndex}
            ✓
        {:else}
            📋
        {/if}
    </button>
{/snippet}

{#snippet replySuggestion(replyContent: string, itemIndex: number)}
    <div class="suggestion-item">
        <div class="suggestion-content">{replyContent}</div>
        {@render copyButton(replyContent, itemIndex)}
    </div>
{/snippet}

<div class="suggestions">
    {#if loading}
        <div class="loading-suggestions">
            <div class="pulse-loader"></div>
            <div class="pulse-loader"></div>
            <div class="pulse-loader"></div>
        </div>
    {:else if replies.length > 0}
        {#each replies as reply, i}
            {@render replySuggestion(reply, i)}
        {/each}
    {:else}
        <div class="empty-state">
            <strong>¯\_(ツ)_/¯</strong>
        </div>
    {/if}
</div>

<style>
    .suggestions {
        margin-top: 1rem;
    }

    .suggestion-item {
        padding: 1rem;
        margin-bottom: 0.75rem;
        border: 1px solid var(--light);
        border-radius: var(--border-radius);
        background-color: var(--white);
        font-family: var(--reply-font);
        line-height: 1.5;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
    }

    .copy-button {
        border: none;
        background-color: transparent;
        color: var(--primary-light);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: var(--border-radius);
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: var(--min-touch-size);
        min-height: var(--min-touch-size);
        font-size: 1.5rem;
    }

    .copy-button:hover,
    .copy-button:active {
        background-color: var(--light);
        color: var(--primary-dark);
    }

    .empty-state {
        color: var(--light);
        text-align: center;
        font-weight: 100;
    }

    .loading-suggestions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        padding: 1.5rem;
    }

    .pulse-loader {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: var(--light);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .pulse-loader:nth-child(2) {
        animation-delay: 0.3s;
    }

    .pulse-loader:nth-child(3) {
        animation-delay: 0.6s;
    }

    @keyframes pulse {
        0% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        50% {
            transform: scale(1.2);
            opacity: 1;
        }
        100% {
            transform: scale(0.8);
            opacity: 0.5;
        }
    }
</style>
