<script lang="ts">
// biome-ignore lint/style/useConst: Svelte 5 $props() pattern
let { value = $bindable('openai') }: { value: string } = $props()
</script>

<section>
	<select 
        id="ai-provider-select" 
        name="provider" 
        bind:value
    >
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