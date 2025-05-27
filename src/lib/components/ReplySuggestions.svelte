<script lang="ts">
// biome-ignore lint/style/useConst: Svelte 5 pattern
export let replies: string[] = []
// biome-ignore lint/style/useConst: Svelte 5 pattern
export let loading = false
export let copiedIndex = -1

// Copy text to clipboard with iOS compatibility
async function copyToClipboard(text: string, index: number) {
    try {
        // Use modern clipboard API which works on iOS
        await navigator.clipboard.writeText(text)

        // Show copy confirmation
        copiedIndex = index

        // Reset after 2 seconds
        setTimeout(() => {
            copiedIndex = -1
        }, 2000)
    } catch (err) {
        // Fallback method for older browsers
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()

        try {
            document.execCommand('copy')
            copiedIndex = index
            setTimeout(() => {
                copiedIndex = -1
            }, 2000)
        } catch (e) {
            console.error('Failed to copy text: ', e)
        }

        document.body.removeChild(textarea)
    }
}
</script>

<div class="suggestions">
    {#if loading}
        <div class="loading-suggestions">
            <div class="pulse-loader"></div>
            <div class="pulse-loader"></div>
            <div class="pulse-loader"></div>
        </div>
    {:else if replies.length > 0}
        {#each replies as reply, i}
            <div class="suggestion-item">
                <div class="suggestion-content">{reply}</div>
                <button 
                    class="copy-button" 
                    onclick={() => copyToClipboard(reply, i)}
                    aria-label="Copy to clipboard"
                >
                    {#if copiedIndex === i}
                        ✓
                    {:else}
                        📋
                    {/if}
                </button>
            </div>
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
        font-size: 1.05rem;
        line-height: 1.5;
        letter-spacing: 0.03em;
        color: var(--primary);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
    }
    
    .suggestion-content {
        flex: 1;
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
        font-size: 1.2rem;
        margin-top: -0.5rem;
        margin-right: -0.5rem;
    }
    
    .copy-button:hover, .copy-button:active {
        background-color: var(--light);
        color: var(--primary);
    }
    
    .empty-state {
        color: var(--gray);
        font-style: italic;
        text-align: center;
        padding: 1rem;
    }
    
    @media (min-width: 768px) {
        .suggestion-item {
            padding: 0.75rem;
            margin-bottom: 0.5rem;
            font-size: 1.02rem;
        }
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
        background-color: var(--primary-light);
        animation: pulse 1.5s ease-in-out infinite;
    }

    .pulse-loader:nth-child(2) {
        animation-delay: 0.3s;
    }

    .pulse-loader:nth-child(3) {
        animation-delay: 0.6s;
    }
    
    @keyframes pulse {
        0% { transform: scale(0.8); opacity: 0.5; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(0.8); opacity: 0.5; }
    }
</style>
