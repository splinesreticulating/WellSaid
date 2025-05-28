<script lang="ts">
import AdditionalContext from '$lib/components/AdditionalContext.svelte'
import AiProviderSelector from '$lib/components/AiProviderSelector.svelte'
import ControlBar from '$lib/components/ControlBar.svelte'
import ReplySuggestions from '$lib/components/ReplySuggestions.svelte'
import ToneSelector from '$lib/components/ToneSelector.svelte'
import type { Message, PageData, ToneType } from '$lib/types'

const DEFAULT_PROVIDER = 'openai'
const TONES: ToneType[] = ['gentle', 'honest', 'funny', 'reassuring', 'concise']
const { data } = $props<{ data: PageData }>()

const formState = $state({
    ai: {
        provider: DEFAULT_PROVIDER,
    },
    ui: {
        loading: false,
        copiedIndex: -1,
    },
    form: {
        lookBackHours: '1',
        additionalContext: '',
        tone: 'gentle' as ToneType,
        messages: [] as Message[],
        summary: '',
        suggestedReplies: [] as string[],
    },
})

const LOCAL_STORAGE_CONTEXT_KEY = 'wellsaid_additional_context'
let additionalContextExpanded = $state(false)

// Derived values
const hasMessages = $derived(formState.form.messages.length > 0)
const canGenerateReplies = $derived(hasMessages && !formState.ui.loading)
const showLoadingIndicators = $derived(formState.ui.loading)
const summaryContent = $derived(
    formState.ui.loading
        ? 'Generating summary and replies...'
        : formState.form.summary ||
              '<em>click "go" to generate a conversation summary</em>',
)

if (data?.messages && Array.isArray(data.messages)) {
    formState.form.messages = data.messages
}

$effect(() => {
    const storedContext = localStorage.getItem(LOCAL_STORAGE_CONTEXT_KEY)
    if (storedContext) {
        formState.form.additionalContext = storedContext
        if (storedContext.trim() !== '') {
            additionalContextExpanded = true
        }
    }
})

$effect(() => {
    if (formState.form.additionalContext) {
        localStorage.setItem(
            LOCAL_STORAGE_CONTEXT_KEY,
            formState.form.additionalContext,
        )
    } else {
        localStorage.removeItem(LOCAL_STORAGE_CONTEXT_KEY)
    }
})

async function getMessages() {
    const end = new Date()
    const start = new Date(
        end.getTime() -
            Number.parseInt(formState.form.lookBackHours) * 60 * 60 * 1000,
    )

    const res = await fetch(
        `/api/messages?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`,
    )
    const data = await res.json()

    if (data?.messages && Array.isArray(data.messages)) {
        formState.form.messages = data.messages
    }
}

$effect(() => {
    getMessages()
})

function handleSubmit(event: Event) {
    event.preventDefault()
}

// generate summary and replies
async function onclick() {
    formState.ui.loading = true
    formState.form.summary = ''
    formState.form.suggestedReplies = []

    try {
        const response = await fetch('/api/suggestions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: formState.form.messages,
                tone: formState.form.tone,
                context: formState.form.additionalContext,
                provider: formState.ai.provider,
            }),
        })

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`)
        }

        const result = await response.json()

        if (result.error) {
            throw new Error(result.error)
        }

        formState.form.summary = result.summary
        formState.form.suggestedReplies = result.replies
    } catch (error) {
        console.error('Error generating replies:', error)
        formState.form.summary = 'Error generating summary. Please try again.'
    } finally {
        formState.ui.loading = false
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

			<ControlBar 
				bind:lookBackHours={formState.form.lookBackHours}
				messageCount={formState.form.messages.length}
				onGoClick={onclick} 
				canGenerate={canGenerateReplies}
				isLoading={showLoadingIndicators}
			/>

			<!-- Additional context (collapsible) -->
			<AdditionalContext bind:additionalContext={formState.form.additionalContext} bind:expanded={additionalContextExpanded} />

			<!-- Conversation summary -->
			<section class="conversation">
				<div class="summary">
					{#if showLoadingIndicators}
						<div class="loading-indicator">{@html summaryContent}</div>
					{:else}
						{@html summaryContent}
					{/if}
				</div>
			</section>

			<hr />

			<!-- Reply suggestions section -->
			<section class="reply-section">
				<h2>suggested replies</h2>

				<ToneSelector 
					bind:selectedTone={formState.form.tone} 
					tones={TONES} 
				/>

				<ReplySuggestions 
					replies={formState.form.suggestedReplies} 
					loading={showLoadingIndicators}
				/>
			</section>
			<AiProviderSelector bind:value={formState.ai.provider} />
		</form>
	</div>
</main>

<style>
	/* ===== Layout & Structure ===== */
	main.app {
		max-width: 800px;
		margin: 0 auto;
		padding-bottom: 4rem;
		width: 100%; /* Ensure it respects parent's padding */
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

	h2 {
		margin-top: 0.1rem;
	}

	/* ===== Conversation Section ===== */
	.conversation {
		background-color: var(--light);
		min-height: 120px;
		transition: opacity 0.3s;
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
		overflow-wrap: break-word; /* Prevent long words from overflowing */
	}

	hr {
		border: none;
		border-top: 1px solid var(--light);
		margin: 1rem 0;
	}
	
	@media (min-width: 768px) {
		.content-container > form {
			max-width: 600px;
			margin: 0 auto;
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

	/* ===== Animations ===== */
	@keyframes pulse {
		0% { transform: scale(0.8); opacity: 0.5; }
		50% { transform: scale(1.2); opacity: 1; }
		100% { transform: scale(0.8); opacity: 0.5; }
	}
</style>
