<script lang="ts">
	import type { Message, PageData } from "$lib/types";

	const TONES = ["gentle", "honest", "funny", "reassuring", "concise"];
	const { data } = $props<{ data: PageData }>();
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
		loading: false,
	});

	if (data?.messages && Array.isArray(data.messages)) {
		formState.messages = data.messages;
	}

	async function getMessages() {
		const end = new Date();
		const start = new Date(
			end.getTime() - parseInt(formState.lookBackHours) * 60 * 60 * 1000,
		);

		const res = await fetch(
			`/api/messages?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
		);
		const data = await res.json();

		if (data?.messages && Array.isArray(data.messages)) {
			formState.messages = data.messages;
		}
	}

	$effect(() => {
		getMessages();
	});

	function handleSubmit(event: Event) {
		event.preventDefault();
	}

	function selectTone(tone: string) {
		formState.tone = tone;
	}
</script>

<main class="app">
	<header>
		<h1>Well Said</h1>
		<i>Empathy. Upgraded.</i>
	</header>

	<div class="content-container">
		<form onsubmit={handleSubmit}>
			<!-- Time frame selector and message count -->
			<section class="control-bar">
				<div class="timeframe-controls">
					<label for="window-back">Summarize the last:</label>
					<select
						id="window-back"
						class="hours-dropdown"
						bind:value={formState.lookBackHours}
					>
						<option value="1">hour</option>
						<option value="2">2 hours</option>
						<option value="3">3 hours</option>
						<option value="4">4 hours</option>
						<option value="5">5 hours</option>
						<option value="6">6 hours</option>
						<option value="12">12 hours</option>
						<option value="24">24 hours</option>
					</select>
				</div>
				<div class="message-count">
					messages:&nbsp;
					<span class="message-count-value"
						>{formState.messages.length}</span
					>
				</div>
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
			</section>

			<hr />

			<!-- Reply suggestions section -->
			<section class="reply-section">
				<h2>Suggested replies</h2>

				<!-- Tone selector -->
				<div class="tone-selector">
					{#each TONES as tone}
						<label class={formState.tone === tone ? "active" : ""}>
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
						<div class="empty-state">
							<strong>¯\_(ツ)_/¯</strong>
						</div>
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
		--border-radius: 8px;
	}

	/* Layout */
	main.app {
		max-width: 800px;
		margin: 0 auto;
		font-family: "Space Mono", Georgia, "Times New Roman", Times, serif;
		color: var(--primary);
	}

	header {
		text-align: center;
		margin-bottom: 1rem;
	}

	header h1 {
		font-family: "Great Vibes", cursive;
		font-size: 3rem;
		color: var(--primary);
		margin-bottom: 0.25rem;
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

	.control-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		background-color: var(--white);
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		margin-bottom: 1rem;
	}

	.timeframe-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		line-height: 1;
	}

	.timeframe-controls label {
		font-weight: 500;
		white-space: nowrap;
		min-width: max-content;
		display: inline-flex;
		align-items: center;
		margin: 0;
	}

	.timeframe-controls select.hours-dropdown {
		margin: 0;
	}

	.timeframe-controls select.hours-dropdown:focus {
		outline: none;
		border-color: var(--primary);
		box-shadow: 0 0 0 2px rgba(85, 91, 110, 0.2);
	}
	details {
		text-align: left;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		padding: 0.75rem 1rem;
		background-color: var(--white);
		margin-bottom: 1rem;
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
		padding: 1.25rem;
		min-height: 100px;
		margin-bottom: 1rem;
	}

	.message-count {
		font-size: 0.95rem;
		color: var(--gray);
		display: flex;
		align-items: center;
		padding: 0.5rem 0;
	}

	.message-count-value {
		font-weight: 600;
		color: var(--primary);
		margin-right: 0.25rem;
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
		gap: 0.75rem;
		margin: 0.75rem 0 1.25rem;
	}

	.tone-selector label {
		display: inline-flex;
		align-items: center;
		padding: 0.5rem 0.875rem;
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		cursor: pointer;
		font-size: 0.95rem;
		transition:
			background-color 0.2s,
			color 0.2s,
			box-shadow 0.2s;
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
</style>
