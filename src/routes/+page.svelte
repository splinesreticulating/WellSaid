<script lang="ts">
import { enhance } from '$app/forms'
import { goto } from '$app/navigation'
import AdditionalContext from '$lib/components/AdditionalContext.svelte'
import AiProviderSelector from '$lib/components/AiProviderSelector.svelte'
import ControlBar from '$lib/components/ControlBar.svelte'
import ReplySuggestions from '$lib/components/ReplySuggestions.svelte'
import ToneSelector from '$lib/components/ToneSelector.svelte'
import type { Message, PageData, ToneType } from '$lib/types'

const DEFAULT_PROVIDER = 'openai'
const TONES: ToneType[] = ['gentle', 'funny', 'reassuring', 'concise']
const LOCAL_STORAGE_CONTEXT_KEY = 'wellsaid_additional_context'

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

// Update messages when data changes
$effect(() => {
    if (data?.messages && Array.isArray(data.messages)) {
        formState.form.messages = data.messages
    }
})

// Watch for changes to lookBackHours and navigate to the new URL
$effect(() => {
    const lookBack = formState.form.lookBackHours
    if (lookBack) {
        const url = new URL(window.location.href)
        const current = url.searchParams.get('lookBackHours')

        if (current === lookBack) return

        // Update the URL with the new lookBackHours parameter
        url.searchParams.set('lookBackHours', lookBack)

        // Use SvelteKit's goto to navigate to the new URL
        // This will trigger a new page load with the updated parameter
        goto(url.toString(), { keepFocus: true, noScroll: true })
    }
})

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

// biome-ignore lint/style/useConst: assigned by Svelte via bind:this
let formElement: HTMLFormElement | null = null

const enhanceSubmit: import('@sveltejs/kit').SubmitFunction = () => {
    formState.ui.loading = true
    formState.form.summary = 'Generating summary and replies...'
    formState.form.suggestedReplies = []

    // Return a function that will be called with the form submission result
    return async ({ result, update }) => {
        try {
            // Handle the form submission result
            if (result.type === 'success' && result.data) {
                formState.form.summary = result.data.summary || ''
                formState.form.suggestedReplies = result.data.replies || []
            } else if (result.type === 'failure') {
                formState.form.summary =
                    result.data?.error ||
                    'Error generating summary. Please try again.'
                formState.form.suggestedReplies = []
            }

            // Call update to handle the form submission result
            await update()
        } catch (error) {
            console.error('Error processing form submission:', error)
            formState.form.summary =
                'An error occurred while processing the response.'
            formState.form.suggestedReplies = []
        } finally {
            // Only set loading to false after a short delay to ensure UI updates are visible
            setTimeout(() => {
                formState.ui.loading = false
            }, 100)
        }
    }
}

function onclick() {
    formElement?.requestSubmit()
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
                <form
                    action="?/generate"
                    method="POST"
                    use:enhance={enhanceSubmit}
                    bind:this={formElement}
                >
                    <!-- Hidden fields to include in form submission -->
                    <input type="hidden" name="messages" value={JSON.stringify(formState.form.messages)} />
                    <input type="hidden" name="tone" value={formState.form.tone} />
                    <input type="hidden" name="context" value={formState.form.additionalContext} />
                    <input type="hidden" name="provider" value={formState.ai.provider} />

			<ControlBar 
				bind:lookBackHours={formState.form.lookBackHours}
				messageCount={formState.form.messages.length}
				onclick={onclick}
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
				<h2>suggested replies:</h2>

				<ToneSelector 
					bind:selectedTone={formState.form.tone} 
					tones={TONES} 
				/>
				

				<ReplySuggestions 
					replies={formState.form.suggestedReplies} 
					loading={showLoadingIndicators}
				/>
			</section>
			<hr />
			<AiProviderSelector bind:value={formState.ai.provider} />
		</form>
	</div>
</main>

<style>
	/* ===== Layout & Structure ===== */
	main.app {
		padding-bottom: 1rem;
	}

	@media (min-width: 768px) {
		.content-container > form {
			max-width: 600px;
			margin: 0 auto;
		}
	}

	form {
		display: flex;
		flex-direction: column;
		border: 1px solid var(--light);
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
		background-color: var(--primary-light);
	}

	/* ===== Header ===== */
	header {
		text-align: center;
	}

	header h1 {
		font-family: var(--heading-font);
		font-size: 3rem;
		text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.1);
		margin-top: 1rem;
		margin-bottom: 0;
	}

	header i {
		font-style: italic;
		font-size: 1rem;
		display: block;
		margin-bottom: 1.25rem;
	}

	/* ===== Conversation Section ===== */
	.conversation {
		background-color: var(--light);
		min-height: 20px;
		transition: opacity 0.3s;
		border-radius: var(--border-radius);
		padding: 1rem;
		margin-bottom: 1rem;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
	}

	.summary {
		font-family: var(--summary-font);
		font-size: 1rem;
		line-height: 1.6;
		letter-spacing: 0.02em;
		overflow-wrap: break-word; /* Prevent long words from overflowing */
	}

	hr {
		border: 0;
		height: 1px;
		background-image: linear-gradient(
			to right,
			hsla(var(--primary-hsl, 0, 0%, 20%), 0),
			hsl(var(--primary-hsl, 0, 0%, 20%)),
			hsla(var(--primary-hsl, 0, 0%, 20%), 0)
		);
		margin: 1rem 0;
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
