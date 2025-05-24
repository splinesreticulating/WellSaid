<script lang="ts">
import type { Message, PageData, ToneType } from '$lib/types'

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
    copiedIndex: -1, // Track which item was copied to show feedback
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

// Copy text to clipboard with iOS compatibility
async function copyToClipboard(text: string, index: number) {
    try {
        // Use modern clipboard API which works on iOS
        await navigator.clipboard.writeText(text);
        
        // Show copy confirmation
        formState.copiedIndex = index;
        
        // Reset after 2 seconds
        setTimeout(() => {
            formState.copiedIndex = -1;
        }, 2000);
    } catch (err) {
        // Fallback method for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
            document.execCommand('copy');
            formState.copiedIndex = index;
            setTimeout(() => {
                formState.copiedIndex = -1;
            }, 2000);
        } catch (e) {
            console.error('Failed to copy text: ', e);
        }
        
        document.body.removeChild(textarea);
    }
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
		<h1>WellSaid</h1>
		<i>Empathy. Upgraded.</i>
	</header>

	<div class="content-container">
		<form onsubmit={handleSubmit}>

			<!-- Time frame selector and message count -->
			<section class="control-bar">
				<div class="timeframe-controls">
					<label for="window-back">summarize last:</label>
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
						{#each formState.suggestedReplies as reply, i}
							<div class="suggestion-item">
								<div class="suggestion-content">{reply}</div>
								<button 
									class="copy-button" 
									onclick={() => copyToClipboard(reply, i)}
									aria-label="Copy to clipboard"
								>
									{#if formState.copiedIndex === i}
										✓
									{:else}
										📋
									{/if}
								</button>
							</div>
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
		--summary-font: 'Georgia', serif;
		--reply-font: 'Palatino', 'Garamond', serif;
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
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
		margin-bottom: 0; /* Remove space below h1 */
	}

	header i {
		font-style: italic;
		/* color: var(--primary-light); */
		font-size: 1rem;
		display: block;
		margin-bottom: 2rem;
	}

	/* Content layout */
	.content-container {
		width: 100%;
		max-width: 100%;
		display: flex;
		flex-direction: column;
		padding-right: 2.5rem;
	}
	
	@media (min-width: 768px) {
		.app {
			padding: 0 1.5rem 0 0;
			max-width: 800px;
		}
	}

	form {
		width: 100%;
		display: flex;
		flex-direction: column;
	}

	/* Controls */
	.control-bar {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-bottom: 1rem;
		justify-content: space-between;
	}

	.timeframe-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		line-height: 1;
		flex-wrap: nowrap;
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
		padding: 0.5rem 1rem;
		background-color: var(--primary-light);
		color: var(--white);
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, transform 0.1s;
		margin-left: 0.25rem;
		min-height: 44px; /* Minimum touch target size */
		min-width: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
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
	details.context-details {
		text-align: left;
		border: 1px solid var(--light);
		background-color: var(--white);
		margin-right: 1rem;
	}

	details summary {
		cursor: pointer;
		font-weight: 500;
		/* Using the browser's default disclosure triangle */
	}

	textarea.context-input {
		width: 90%;
		margin-top: 0.75rem;
		padding: 0.75rem;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		resize: vertical;
		font-size: 16px; /* Prevents iOS zoom on focus */
		min-height: 80px;
	}
	
	/* Make select elements bigger and easier to tap on mobile */
	select {
		font-size: 16px;
		padding: 0.5rem;
		height: 44px;
		border-radius: var(--border-radius);
		border: 1px solid var(--light);
		background-color: var(--white);
		appearance: none;
		background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23555B6E%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
		background-repeat: no-repeat;
		background-position: right 0.7rem top 50%;
		background-size: 0.65rem auto;
		padding-right: 1.75rem;
	}

	/* Common styles for boxes */
	.conversation, details.context-details {
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}
	
	/* Conversation */
	.conversation {
		background-color: var(--light);
		min-height: 120px;
		transition: opacity 0.3s;
		margin-right: 1rem;
	}
	
	@media (min-width: 768px) {
		.conversation, details.context-details {
			padding: 1.25rem;
		}
	}

	.summary {
		font-family: 'Georgia', serif;
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--primary);
		letter-spacing: 0.02em;
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
		gap: 0.25rem;
	}

	.tone-selector label {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.05rem 0.75rem;
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		cursor: pointer;
		font-size: 0.85rem;
		transition:
			background-color 0.2s,
			color 0.2s,
			box-shadow 0.2s;
		min-height: 28px;
		min-width: 60px;
	}

	.tone-selector label.active {
		background-color: var(--primary-light);
		color: var(--white);
	}

	.tone-selector input[type="radio"] {
		margin-right: 0.5rem;
	}
	
	@media (min-width: 768px) {
		.tone-selector {
			gap: 0.75rem;
			justify-content: flex-start;
		}
		
		.tone-selector label {
			padding: 0.75rem 1rem;
			font-size: 1rem;
			min-height: 44px;
			min-width: 70px;
		}
	}

	/* Suggestions */
	.suggestions {
		margin-top: 1rem;
	}

	.suggestion-item {
		padding: 1rem;
		margin-bottom: 0.75rem;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		background-color: var(--white);
		font-family: 'Palatino', 'Garamond', serif;
		font-size: 1.05rem;
		line-height: 1.5;
		letter-spacing: 0.03em;
		color: var(--primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 0.75rem;
	}
	
	.suggestion-content {
		flex: 1;
	}
	
	.copy-button {
		border: none;
		background-color: transparent;
		color: var(--primary-light);
		cursor: pointer;
		padding: 0.5rem;
		border-radius: var(--border-radius);
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px; /* Ensures good touch target size for iOS */
		font-size: 1.2rem;
		margin-top: -0.5rem;
		margin-right: -0.5rem;
	}
	
	.copy-button:hover, .copy-button:active {
		background-color: var(--light);
		color: var(--primary);
	}
	
	@media (min-width: 768px) {
		.suggestion-item {
			padding: 0.75rem;
			margin-bottom: 0.5rem;
			font-size: 1.02rem;
		}
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
