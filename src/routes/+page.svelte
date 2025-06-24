<script lang="ts">
    import { browser } from '$app/environment'
    import { goto } from '$app/navigation'
    import AdditionalContext from '$lib/components/AdditionalContext.svelte'
    import AiProviderSelector from '$lib/components/AiProviderSelector.svelte'
    import ControlBar from '$lib/components/ControlBar.svelte'
    import ReplySuggestions from '$lib/components/ReplySuggestions.svelte'
    import SettingsForm from '$lib/components/SettingsForm.svelte'
    import ToneSelector from '$lib/components/ToneSelector.svelte'
    import type { Setting } from '$lib/config'
    import type { ProviderConfig } from '$lib/providers/registry'
    import { type Message, type PageData, TONES, type ToneType } from '$lib/types'

    const LOCAL_STORAGE_CONTEXT_KEY = 'wellsaid_additional_context'

    const { data } = $props<{
        data: PageData & {
            multiProvider: boolean
            defaultProvider: string
            availableProviders: ProviderConfig[]
            settings: Setting[]
        }
    }>()

    const DEFAULT_PROVIDER = data.defaultProvider

    let formState = $state({
        ai: {
            provider: DEFAULT_PROVIDER || data.availableProviders[0]?.id || '',
        },
        ui: {
            loading: false,
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

    let activeTab = $state<'main' | 'settings'>('main')

    let additionalContextExpanded = $state(false)

    // Derived values
    const hasMessages = $derived(formState.form.messages.length > 0)
    const canGenerateReplies = $derived(hasMessages && !formState.ui.loading)
    const hasProviders = $derived(data.availableProviders.length > 0)
    const showLoadingIndicators = $derived(formState.ui.loading)
    const summaryContent = $derived(
        formState.ui.loading
            ? 'Generating summary and replies...'
            : formState.form.summary || 'click "go" to generate a conversation summary'
    )

    // Update messages when data changes
    $effect(() => {
        if (data?.messages && Array.isArray(data.messages)) {
            formState.form.messages = data.messages
        }
    })

    // Watch for changes to lookBackHours and navigate to the new URL
    $effect(() => {
        if (!browser) return

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
        if (!browser) return

        const storedContext = localStorage.getItem(LOCAL_STORAGE_CONTEXT_KEY)
        if (storedContext) {
            formState.form.additionalContext = storedContext
            if (storedContext.trim() !== '') {
                additionalContextExpanded = true
            }
        }
    })

    $effect(() => {
        if (!browser) return

        if (formState.form.additionalContext) {
            localStorage.setItem(LOCAL_STORAGE_CONTEXT_KEY, formState.form.additionalContext)
        } else {
            localStorage.removeItem(LOCAL_STORAGE_CONTEXT_KEY)
        }
    })

    function handleSubmit(event: Event) {
        event.preventDefault()
    }

    // Generate summary and replies
    async function queryAI() {
        formState.ui.loading = true
        formState.form.summary = ''
        formState.form.suggestedReplies = []

        try {
            const formData = new FormData()
            formData.append('messages', JSON.stringify(formState.form.messages))
            formData.append('tone', formState.form.tone)
            formData.append('context', formState.form.additionalContext)
            formData.append('provider', formState.ai.provider)

            const response = await fetch('?/generate', {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: formData,
            })

            const result = await response.json()

            if (!response.ok) {
                // Action called fail()
                // result is the object passed to fail(), e.g., { error: 'message', details: '...' }
                const errorMessage = result?.error || 'Unknown error from action'
                throw new Error(`Action failed: ${errorMessage}`)
            }

            // SvelteKit wraps the response in { type, status, data }
            // where data is a JSON string
            if (result && typeof result.data === 'string') {
                try {
                    const parsedData = JSON.parse(result.data)
                    // The parsed data is in an array where:
                    // parsedData[0] is { summary: 1, replies: 2 } (indices into the array)
                    // parsedData[1] is the summary string
                    // parsedData[2] is [3,4,5] (indices of the actual replies in the array)
                    // parsedData[3], parsedData[4], parsedData[5] are the actual replies
                    formState.form.summary = parsedData[1] || 'No summary generated.'

                    // Extract the actual replies using the indices from parsedData[2]
                    const replyIndices = Array.isArray(parsedData[2]) ? parsedData[2] : []
                    const replies = []
                    for (const index of replyIndices) {
                        if (parsedData[index] && typeof parsedData[index] === 'string') {
                            replies.push(parsedData[index])
                        }
                    }
                    formState.form.suggestedReplies = replies
                } catch (parseError) {
                    console.error('Error parsing action data:', parseError)
                    throw parseError
                }
            } else {
                throw new Error('Unexpected response format from server')
            }
        } catch (error) {
            formState.form.summary =
                error instanceof Error
                    ? error.message
                    : 'Error generating summary. Please try again.'
            formState.form.suggestedReplies = [] // Clear replies on error
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

    <nav class="tab-bar">
        <button class:active={activeTab === 'main'} onclick={() => (activeTab = 'main')}>
            home
        </button>
        <button class:active={activeTab === 'settings'} onclick={() => (activeTab = 'settings')}>
            settings
        </button>
    </nav>

    <div class="content-container">
        <div class="tab-content">
            {#if activeTab === 'main'}
                {#if hasProviders}
                    <form onsubmit={handleSubmit}>
                        <ControlBar
                            bind:lookBackHours={formState.form.lookBackHours}
                            messageCount={formState.form.messages.length}
                            onclick={queryAI}
                            canGenerate={canGenerateReplies}
                            isLoading={showLoadingIndicators}
                        />

                        <!-- Additional context (collapsible) -->
                        <AdditionalContext
                            bind:additionalContext={formState.form.additionalContext}
                            bind:expanded={additionalContextExpanded}
                        />

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
                            <h2>suggested replies:</h2>

                            <ToneSelector bind:selectedTone={formState.form.tone} tones={TONES} />

                            <ReplySuggestions
                                replies={formState.form.suggestedReplies}
                                loading={showLoadingIndicators}
                            />
                        </section>
                        <hr />
                        {#if data.multiProvider}
                            <AiProviderSelector
                                bind:value={formState.ai.provider}
                                providers={data.availableProviders}
                            />
                        {/if}
                    </form>
                {:else}
                    <div class="no-providers-message">
                        <h2>No AI providers are configured</h2>
                        <p>Please set at least one provider in settings to use WellSaid.</p>
                        <button
                            onclick={() => (activeTab = 'settings')}
                            class="settings-link-button"
                        >
                            Go to Settings
                        </button>
                    </div>
                {/if}
            {:else}
                <section class="settings-section">
                    <SettingsForm settings={data.settings} />
                </section>
            {/if}
        </div>
    </div>
</main>

<style>
    /* ===== Layout & Structure ===== */
    main.app {
        padding-bottom: 1rem;
    }

    .content-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0;
    }

    .tab-content {
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 600px;
        padding: 1rem;
        border: 1px solid var(--light);
        border-radius: var(--border-radius) 0 var(--border-radius) var(--border-radius);
        background-color: var(--primary-light);
        margin: 0;
        min-height: calc(100vh - 200px);
        overflow-y: auto;
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

    /* ===== Tab Bar ===== */
    .tab-bar {
        display: flex;
        gap: 0;
        padding: 0;
        background-color: transparent;
        margin-bottom: -1px;
        position: relative;
        z-index: 1;
        justify-content: flex-end;
        width: 100%;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
    }

    .tab-bar button {
        font-size: 0.9rem;
        background-color: var(--gray);
        color: var(--white);
        padding: 0.5rem 1rem;
        border-radius: var(--border-radius) var(--border-radius) 0 0;
        border: 1px solid var(--light);
        border-bottom: none;
        cursor: pointer;
        opacity: 0.8;
        margin-left: 2px;
    }

    .tab-bar button.active {
        opacity: 1;
        background-color: var(--primary-light);
        color: var(--primary-dark);
        border-color: var(--light);
        border-bottom: none;
    }

    /* ===== Form Consistency ===== */
    form {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding: 0;
        margin: 0;
        box-shadow: none;
        background-color: transparent;
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

    /* ===== Settings Styling ===== */
    .settings-section {
        width: 100%;
        max-width: 800px;
        margin: 0 auto;
        padding: 0;
    }

    /* ===== No Providers Message ===== */
    .no-providers-message {
        text-align: center;
        padding: 2rem;
        color: var(--primary-dark);
    }

    .no-providers-message h2 {
        color: var(--primary-dark);
        margin-bottom: 1rem;
        font-size: 1.2rem;
    }

    .no-providers-message p {
        margin-bottom: 1.5rem;
        color: var(--gray);
        line-height: 1.4;
    }

    .settings-link-button {
        background-color: var(--primary-dark);
        color: var(--white);
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: var(--border-radius);
        cursor: pointer;
        font-family: var(--body-font);
        font-weight: bold;
        font-size: 1rem;
        transition: background-color 0.2s ease;
    }

    .settings-link-button:hover {
        background-color: var(--primary-light);
        color: var(--primary-dark);
    }
</style>
