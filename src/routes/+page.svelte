<script lang="ts">
import AdditionalContext from '$lib/components/AdditionalContext.svelte'
import ReplySuggestions from '$lib/components/ReplySuggestions.svelte'
import ToneSelector from '$lib/components/ToneSelector.svelte'
import type { Message, PageData, ToneType } from '$lib/types'
import { onMount } from 'svelte'

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

const LOCAL_STORAGE_CONTEXT_KEY = 'wellsaid_additional_context'
let additionalContextExpanded = $state(false)

// Derived values
const hasMessages = $derived(formState.messages.length > 0)
const canGenerateReplies = $derived(hasMessages && !formState.loading)
const showLoadingIndicators = $derived(formState.loading)
const summaryContent = $derived(
    formState.loading
        ? 'Generating summary and replies...'
        : formState.summary || 'Click "go" to generate a conversation summary',
)

if (data?.messages && Array.isArray(data.messages)) {
    formState.messages = data.messages
}

onMount(() => {
    const storedContext = localStorage.getItem(LOCAL_STORAGE_CONTEXT_KEY)
    if (storedContext) {
        formState.additionalContext = storedContext
        if (storedContext.trim() !== '') {
            additionalContextExpanded = true
        }
    }
})

$effect(() => {
    if (formState.additionalContext) {
        localStorage.setItem(
            LOCAL_STORAGE_CONTEXT_KEY,
            formState.additionalContext,
        )
    } else {
        localStorage.removeItem(LOCAL_STORAGE_CONTEXT_KEY)
    }
})

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

async function generateSummaryAndReplies() {
    formState.loading = true
    formState.summary = ''
    formState.suggestedReplies = []

    try {
        const response = await fetch('/api/suggestions', {
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
    } finally {
        formState.loading = false
    }
}
</script>

<svelte:head>
    <title>WellSaid</title>
</svelte:head>

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
					<button type="button" class="go-button" onclick={generateSummaryAndReplies} disabled={!canGenerateReplies}>
				{#if showLoadingIndicators}
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
			<AdditionalContext bind:additionalContext={formState.additionalContext} bind:expanded={additionalContextExpanded} />

			<!-- Conversation summary -->
			<section class="conversation">
				<div class="summary">
					{#if showLoadingIndicators}
						<div class="loading-indicator">{summaryContent}</div>
					{:else}
						{summaryContent}
					{/if}
				</div>
			</section>

			<hr />

			<!-- Reply suggestions section -->
			<section class="reply-section">
				<h2>Suggested replies</h2>

				<!-- Tone selector -->
				<ToneSelector 
					bind:selectedTone={formState.tone} 
					tones={TONES} 
				/>

				<!-- Where suggested replies will appear -->
				<ReplySuggestions 
					replies={formState.suggestedReplies} 
					loading={showLoadingIndicators}
				/>
			</section>
		</form>
	</div>
</main>

<style>
	/* ===== Layout & Structure ===== */
	main.app {
		max-width: 800px;
		margin: 0 auto;
	}

	.content-container {
		width: 100%;
		max-width: 100%;
		display: flex;
		flex-direction: column;
	}

	form {
		display: flex;
		flex-direction: column;
	}

	/* ===== Form Controls ===== */
	.hours-dropdown {
		color: var(--primary);
	}

	/* ===== Header ===== */
	header {
		text-align: center;
		margin-bottom: 1rem;
	}

	header h1 {
		font-family: var(--heading-font);
		font-size: 3rem;
		color: var(--primary);
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
		margin-top: 1rem;
		margin-bottom: 0;
	}

	header i {
		font-style: italic;
		font-size: 1rem;
		display: block;
		margin-bottom: 2rem;
	}

	/* ===== Controls & Inputs ===== */
	.control-bar {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		margin-bottom: 1rem;
		justify-content: space-between;
	}

	/* Timeframe Controls */
	.timeframe-controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
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

	/* Buttons */
	.go-button {
		padding: 0.5rem 1rem;
		background-color: var(--primary);
		color: var(--white);
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, transform 0.1s;
		margin-left: 0.25rem;
		min-height: var(--min-touch-size);
		min-width: var(--min-touch-size);
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

	/* ===== Form Inputs ===== */
	select {
		font-size: 16px;
		padding: 0.5rem;
		height: var(--min-touch-size);
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

	/* ===== Conversation Section ===== */
	.conversation {
		background-color: var(--light);
		min-height: 120px;
		transition: opacity 0.3s;
		margin-right: 1rem;
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.summary {
		font-family: var(--summary-font);
		font-size: 1.05rem;
		line-height: 1.6;
		color: var(--primary);
		letter-spacing: 0.02em;
	}

	.message-count {
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		margin-right: 1rem;
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
	
	@media (min-width: 768px) {
		.conversation {
			padding: 1.25rem;
		}
	}

	/* ===== Loading Indicators ===== */
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

	/* ===== Animations ===== */
	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	@keyframes pulse {
		0% { transform: scale(0.8); opacity: 0.5; }
		50% { transform: scale(1.2); opacity: 1; }
		100% { transform: scale(0.8); opacity: 0.5; }
	}
</style>
