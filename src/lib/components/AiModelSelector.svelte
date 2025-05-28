<script lang="ts">
export let value: string
</script>

<section class="ai-model-selector">
	<label for="ai-model-select">ai api:</label>
	<select id="ai-model-select" bind:value>
		<option value="openai">openai</option>
		<option value="khoj">khoj</option>
	</select>
</section>

<style>
	.ai-model-selector {
		margin-top: 1rem;
	}
</style>
