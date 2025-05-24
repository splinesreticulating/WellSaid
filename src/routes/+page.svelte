<script lang="ts">
import type { Message, PageData } from '$lib/types'

type ToneType = 'gentle' | 'honest' | 'funny' | 'reassuring' | 'concise'
const TONES: ToneType[] = ['gentle', 'honest', 'funny', 'reassuring', 'concise']
const { data } = $props<{ data: PageData }>()
const formState = $state({
    model: 'gpt-4',
    systemPrompt: 'You are a helpful assistant.',
    lookBackHours: '1',
    messages: [] as Message[],
    additionalContext: '',
    userQuery: '',
    tone: 'gentle' as ToneType,
    summary: '',
    suggestedReplies: [] as string[],
    loading: false,
})

if (data?.messages && Array.isArray(data.messages)) {
    formState.messages = data.messages
}

async function getMessages() {
    const end = new Date()
    const start = new Date(
        end.getTime() -
            Number.parseInt(formState.lookBackHours) * 60 * 60 * 1000,
    )

    const res = await fetch(
        `/api/messages?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
    )
    const data = await res.json()

    if (data?.messages && Array.isArray(data.messages)) {
        formState.messages = data.messages
    }
}

$effect(() => {
    getMessages()
})

function handleSubmit(event: Event) {
    event.preventDefault()
}

function selectTone(tone: ToneType) {
    formState.tone = tone
}

async function generateSummaryAndReplies() {
    formState.loading = true

    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: formState.messages,
                tone: formState.tone,
                context: formState.additionalContext,
            }),
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const result = await response.json()

        if (result.error) {
            throw new Error(result.error)
        }

        formState.summary = result.summary
        formState.suggestedReplies = result.replies
    } catch (error) {
        console.error('Error generating replies:', error)
        formState.summary = 'Error generating summary. Please try again.'
        formState.suggestedReplies = []
    } finally {
        formState.loading = false
    }
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
					<button type="button" class="go-button" onclick={generateSummaryAndReplies} disabled={formState.loading}>
				{#if formState.loading}
					<span class="loading-spinner"></span>
				{:else}
					go
				{/if}
			</button>
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
				<div class="summary">
					{#if formState.loading}
						<div class="loading-indicator">Generating summary and replies...</div>
					{:else}
						{formState.summary || 'Click "go" to generate a conversation summary'}
					{/if}
				</div>
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
								onchange={() => selectTone(tone as ToneType)}
							/>
							{tone}
						</label>
					{/each}
				</div>

				<!-- Where suggested replies will appear -->
				<div class="suggestions">
					{#if formState.loading}
						<div class="loading-suggestions">
							<div class="pulse-loader"></div>
							<div class="pulse-loader"></div>
							<div class="pulse-loader"></div>
						</div>
					{:else if formState.suggestedReplies.length > 0}
						{#each formState.suggestedReplies as reply}
							<div class="suggestion-item">{reply}</div>
						{/each}
					{:else}
						<div class="empty-state">
							<strong>¯\_(ツ)_/¯</strong>
						</div>
					{/if}
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
	
	.go-button {
		padding: 0.4rem 0.875rem;
		background-color: var(--primary-light);
		color: var(--white);
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, transform 0.1s;
		margin-left: 0.5rem;
	}
	
	.go-button:hover {
		background-color: var(--primary);
	}
	
	.go-button:active {
		transform: scale(0.98);
	}
	
	.go-button:disabled {
		background-color: var(--light);
		color: var(--gray);
		cursor: not-allowed;
		border-color: var(--light);
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
		transition: opacity 0.3s;
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
	/* Loading indicators */
	.loading-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--gray);
		font-style: italic;
		padding: 1rem;
	}

	.loading-spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid var(--white);
		border-radius: 50%;
		border-top-color: transparent;
		animation: spin 1s linear infinite;
	}

	.loading-suggestions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 1.5rem;
	}

	.pulse-loader {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background-color: var(--primary-light);
		animation: pulse 1.5s ease-in-out infinite;
	}

	.pulse-loader:nth-child(2) {
		animation-delay: 0.3s;
	}

	.pulse-loader:nth-child(3) {
		animation-delay: 0.6s;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes pulse {
		0% { transform: scale(0.8); opacity: 0.5; }
		50% { transform: scale(1.2); opacity: 1; }
		100% { transform: scale(0.8); opacity: 0.5; }
	}
</style>
