<script lang="ts">
export let value: string
</script>

<section>
	<label for="ai-provider-select">ai provider:</label>
	<select id="ai-provider-select" bind:value>
		<option value="openai">openai</option>
		<option value="khoj">khoj</option>
	</select>
</section>
