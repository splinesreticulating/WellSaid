<script lang="ts">
import type { ToneType } from '$lib/types'

// biome-ignore lint/style/useConst: Svelte 5 $props() pattern
let { selectedTone = $bindable(), tones = [] }: { selectedTone?: ToneType, tones?: ToneType[] } = $props();
</script>

<div class="tone-selector">
    {#each tones as tone}
        <label class={selectedTone === tone ? 'active' : ''}>
            <input
                type="radio"
                name="tone"
                bind:group={selectedTone}
                value={tone}
            />
            {tone}
        </label>
    {/each}
</div>

<style>
    .tone-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .tone-selector label {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.05rem 0.75rem;
        border: 1px solid var(--primary-light);
        border-radius: var(--border-radius);
        cursor: pointer;
        font-size: 0.85rem;
        transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;
        min-height: 28px;
        min-width: 60px;
    }

    .tone-selector label.active {
        background-color: var(--primary-light);
        color: var(--white);
    }

    .tone-selector input[type="radio"] {
        margin-right: 0.5rem;
    }
    
    @media (min-width: 768px) {
        .tone-selector {
            gap: 0.75rem;
            justify-content: flex-start;
        }
        
        .tone-selector label {
            padding: 0.75rem 1rem;
            font-size: 1rem;
            min-height: var(--min-touch-size);
            min-width: 70px;
        }
    }
</style>
