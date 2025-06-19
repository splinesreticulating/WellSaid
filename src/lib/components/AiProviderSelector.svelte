<script lang="ts">
    import type { ProviderConfig } from '$lib/providers/registry'

    let { 
        value = $bindable('openai'), 
        providers = [] 
    }: { 
        value: string
        providers: ProviderConfig[]
    } = $props()
</script>

<section>
    <select id="ai-provider-select" bind:value>
        {#each providers as provider (provider.id)}
            <option value={provider.id}>{provider.displayName}</option>
        {/each}
    </select>
</section>

<style>
    section {
        margin: 1rem;
        text-align: center;
    }
</style>
