<script lang="ts">
// biome-ignore lint/style/useConst: Svelte 5 $props() pattern
let { value = $bindable('') }: { value?: string } = $props()
</script>

<section>
	<label for="ai-provider-select">ai provider:</label>
	<select id="ai-provider-select" bind:value>
		<option value="openai">openai</option>
		<option value="khoj">khoj</option>
	</select>
</section>
