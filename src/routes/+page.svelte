<script lang="ts">
	import type { Message } from '$lib/types'

	let formState = $state({
		model: 'gpt-4',
		systemPrompt: 'You are a helpful assistant.',
		lookBackHours: "24",
		messages: [] as Message[],
		additionalContext: '',
		userQuery: '',
		tone: 'gentle',
		summary: '',
		suggestedReplies: [],
		loading: false
	})

	let hasMoreContext = $derived(formState.additionalContext.trim().length > 0)

const { data } = $props()

// Initialize formState.messages from server data
if (data && 'messages' in data && Array.isArray(data.messages)) {
  formState.messages = data.messages
}

</script>

<h1>Well Said</h1>
<p><i>Empathy. Upgraded.</i></p>

<details>{JSON.stringify({formState})}</details>

<div class="content-container">
	<form>
		<div class="timeframe-controls">
			<label for="window-back">summarize the last:</label>
			<select id="window-back" name="window-back" bind:value={formState.lookBackHours}>
				<option value="1">hour</option>
				<option value="2">2 hours</option>
				<option value="3">3 hours</option>
				<option value="4">4 hours</option>
				<option value="5">5 hours</option>
				<option value="6">6 hours</option>
				<option value="12">12 hours</option>
				<option value="24">24 hours</option>
			</select>
			<button id="go-btn">go</button>
		</div>
		<details id="context-details" open={false}>
			<summary>add more context</summary>
			<textarea id="context-input" rows="4"></textarea>
			<div class="context-hint">anything else we should know about?</div>
		</details>
		<div id="conversation" class="conversation" style="display: block;">
			<div class="summary"></div>
			<div class="message-count">{formState.messages.length} messages</div>
		</div>
		<hr />
		<h2>suggested replies</h2>
		<div id="tone-container">
			<div id="tone-radio-group" class="radio-group">
				<label class="active"
					><input
						type="radio"
						name="tone"
						value="gentle"
						checked={formState.tone === 'gentle'}
					/>gentle</label
				>
				<label
					><input
						type="radio"
						name="tone"
						value="honest"
						checked={formState.tone === 'honest'}
					/>honest</label
				>
				<label
					><input
						type="radio"
						name="tone"
						value="funny"
						checked={formState.tone === 'funny'}
					/>funny</label
				>
				<label
					><input
						type="radio"
						name="tone"
						value="reassuring"
						checked={formState.tone === 'reassuring'}
					/>reassuring</label
				>
				<label
					><input
						type="radio"
						name="tone"
						value="concise"
						checked={formState.tone === 'concise'}
					/>concise</label
				>
			</div>
		</div>
		<div id="suggestions" class="suggestions"></div>
	</form>
</div>

<style>
	/* colors */
	:root {
		--primary: #555b6e;
		--primary-light: #89b0ae;
		--light: #bee3db;
		--success: #00c853;
		--warning: #df8950;
		--error: #ff5252;
		--gray: #555b6e;
		--white: #faf9f9;
	}

	form {
		display: flex;
		gap: 1rem;
		padding: 1rem;
	}

	button {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.75rem 1.5rem;
		font-weight: 500;
		cursor: pointer;
		transition: var(--standard-transition);
	}

	details {
		text-align: left;
	}
</style>
