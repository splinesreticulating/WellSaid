<script lang="ts">
    import type { ToneType } from '$lib/types'

    let {
        selectedTone = $bindable(),
        tones = [] as const,
    }: {
        selectedTone: ToneType
        tones: readonly ToneType[]
    } = $props()
</script>

{#snippet toneOption(toneValue: ToneType)}
    <label class={selectedTone === toneValue ? 'active' : ''}>
        <input type="radio" name="tone" bind:group={selectedTone} value={toneValue} />
        {toneValue}
    </label>
{/snippet}

<div class="tone-selector">
    {#each tones as tone}
        {@render toneOption(tone)}
    {/each}
</div>

<style>
    .tone-selector {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        background-color: var(--primary-light);
    }

    .tone-selector label {
        font-family: var(--label-font);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.05rem 0.5rem;
        border: 1px solid var(--primary-light);
        border-radius: var(--border-radius);
        cursor: pointer;
        font-size: 0.73rem;
        transition:
            background-color 0.2s,
            color 0.2s,
            box-shadow 0.2s;
        min-height: 28px;
        min-width: 60px;
        background-color: var(--light);
    }

    .tone-selector label.active {
        background-color: var(--primary-dark);
        color: var(--white);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
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

    @media (max-width: 767px) {
        .tone-selector label input[type='radio'] {
            display: none;
        }
    }
</style>
