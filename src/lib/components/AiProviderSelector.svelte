<script lang="ts">
    let { value = $bindable('openai') }: { value: string } = $props()
</script>

<section>
    <select id="ai-provider-select" bind:value>
        <option value="openai">openai</option>
        <option value="khoj">khoj</option>
    </select>
</section>

<style>
    section {
        margin: 1rem;
        text-align: center;
    }
</style>
