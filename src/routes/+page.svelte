<script lang="ts">
	// Import types
	import type { Message } from "$lib/types";

	// Define interface for page data
	interface PageData {
		messages?: Message[];
	}

	// Available tone options
	const TONES = ['gentle', 'honest', 'funny', 'reassuring', 'concise'];
	
	// State management using Svelte 5 $state
	let formState = $state({
		model: "gpt-4",
		systemPrompt: "You are a helpful assistant.",
		lookBackHours: "1",
		messages: [] as Message[],
		additionalContext: "",
		userQuery: "",
		tone: "gentle",
		summary: "",
		suggestedReplies: [],
		loading: false
	});

	// Properly type the data prop
	const { data } = $props<{ data: PageData }>();

	// Initialize messages from server data if available
	if (data?.messages && Array.isArray(data.messages)) {
		formState.messages = data.messages;
	}

	// Fetch messages for the selected time period
	async function getMessages() {
		const end = new Date();
		const start = new Date(end.getTime() - parseInt(formState.lookBackHours) * 60 * 60 * 1000);
		
		const res = await fetch(
			`/api/messages?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`
		);
		const data = await res.json();

		if (data?.messages && Array.isArray(data.messages)) {
			formState.messages = data.messages;
		}
	}

	// Reactive effect to update messages when lookBackHours changes
	$effect(() => {
		getMessages();
	});

	// Form submission handler
	function handleSubmit(event: Event) {
		event.preventDefault();
		// Additional submission logic would go here
	}

	// Update tone selection
	function selectTone(tone: string) {
		formState.tone = tone;
	}
</script>

<main class="app">
	<header>
		<h1>Well Said</h1>
		<p><i>Empathy. Upgraded.</i></p>
	</header>

	<!-- Debug info (collapsible) -->
	<details class="debug-info">
		<summary>Debug Info</summary>
		<pre>{JSON.stringify({ formState }, null, 2)}</pre>
	</details>

	<div class="content-container">
		<form onsubmit={handleSubmit}>
			<!-- Time frame selector -->
			<section class="timeframe-controls">
				<label for="window-back">Summarize the last:</label>
				<select id="window-back" bind:value={formState.lookBackHours}>
					<option value="1">hour</option>
					<option value="2">2 hours</option>
					<option value="3">3 hours</option>
					<option value="4">4 hours</option>
					<option value="5">5 hours</option>
					<option value="6">6 hours</option>
					<option value="12">12 hours</option>
					<option value="24">24 hours</option>
				</select>
			</section>
			
			<!-- Additional context (collapsible) -->
			<details class="context-details">
				<summary>Add more context</summary>
				<textarea 
					class="context-input" 
					rows="4" 
					bind:value={formState.additionalContext} 
					placeholder="Anything else we should know about?"
				></textarea>
			</details>
			
			<!-- Conversation summary -->
			<section class="conversation">
				<div class="summary">{formState.summary}</div>
				<div class="message-count">{formState.messages.length} messages</div>
			</section>
			
			<hr />
			
			<!-- Reply suggestions section -->
			<section class="reply-section">
				<h2>Suggested replies</h2>
				
				<!-- Tone selector -->
				<div class="tone-selector">
					{#each TONES as tone}
						<label class={formState.tone === tone ? 'active' : ''}>
							<input 
								type="radio" 
								name="tone" 
								value={tone} 
								checked={formState.tone === tone} 
								onchange={() => selectTone(tone)} 
							/>
							{tone}
						</label>
					{/each}
				</div>
				
				<!-- Where suggested replies will appear -->
				<div class="suggestions">
					{#each formState.suggestedReplies as reply}
						<div class="suggestion-item">{reply}</div>
					{:else}
						<div class="empty-state">No suggestions available yet</div>
					{/each}
				</div>
			</section>
		</form>
	</div>
</main>

<style>
	/* Color variables */
	:root {
		--primary: #555b6e;
		--primary-light: #89b0ae;
		--light: #bee3db;
		--success: #00c853;
		--warning: #df8950;
		--error: #ff5252;
		--gray: #555b6e;
		--white: #faf9f9;
		--border-radius: 4px;
	}

	/* Layout */
	main.app {
		max-width: 800px;
		margin: 0 auto;
		font-family: system-ui, sans-serif;
	}

	header {
		text-align: center;
		margin-bottom: 1rem;
	}

	.content-container {
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
	}

	/* Sections */
	section {
		margin-bottom: 1rem;
	}

	.timeframe-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.timeframe-controls select {
		padding: 0.25rem 0.5rem;
		border-radius: var(--border-radius);
		border: 1px solid var(--primary-light);
	}

	/* Details and context */
	details {
		text-align: left;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		padding: 0.5rem;
	}

	details summary {
		cursor: pointer;
		font-weight: 500;
	}

	textarea.context-input {
		width: 100%;
		margin-top: 0.5rem;
		padding: 0.5rem;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		resize: vertical;
	}

	/* Conversation */
	.conversation {
		background-color: var(--light);
		border-radius: var(--border-radius);
		padding: 1rem;
	}

	.message-count {
		font-size: 0.875rem;
		color: var(--gray);
		margin-top: 0.5rem;
	}

	hr {
		border: none;
		border-top: 1px solid var(--light);
		margin: 1rem 0;
	}

	/* Tone selector */
	.tone-selector {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0.5rem 0 1rem;
	}

	.tone-selector label {
		display: inline-flex;
		align-items: center;
		padding: 0.25rem 0.75rem;
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		cursor: pointer;
		font-size: 0.875rem;
		transition: background-color 0.2s, color 0.2s;
	}

	.tone-selector label.active {
		background-color: var(--primary-light);
		color: var(--white);
	}

	.tone-selector input[type="radio"] {
		margin-right: 0.25rem;
	}

	/* Suggestions */
	.suggestions {
		margin-top: 1rem;
	}

	.suggestion-item {
		padding: 0.75rem;
		margin-bottom: 0.5rem;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		background-color: var(--white);
	}

	.empty-state {
		color: var(--gray);
		font-style: italic;
		text-align: center;
		padding: 1rem;
	}

	/* Debug info */
	.debug-info {
		margin-bottom: 1rem;
		font-size: 0.75rem;
	}

	.debug-info pre {
		overflow: auto;
		background-color: #f5f5f5;
		padding: 0.5rem;
		border-radius: var(--border-radius);
	}
</style>
