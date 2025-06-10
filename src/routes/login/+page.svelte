<script lang="ts">
    import { page } from '$app/state'
    import { enhance } from '$app/forms'
    import type { ActionData } from './$types'

    const { form }: { form: ActionData } = $props()

    const formState = $state({
        username: '',
        password: '',
        loading: false,
    })

    // Check for error query parameter (rate limiting)
    $effect(() => {
        const errorParam = page.url.searchParams.get('error')
        if (errorParam === 'too_many_attempts') {
            // This will be handled by the error display below
        }
    })
</script>

<svelte:head>
    <title>Login</title>
</svelte:head>

<div class="login-card">
    <form
        method="POST"
        use:enhance={() => {
            formState.loading = true
            return async ({ update }) => {
                await update()
                formState.loading = false
            }
        }}
    >
        {#if form?.error}
            <div class="error-message">{form.error}</div>
        {:else if page.url.searchParams.get('error') === 'too_many_attempts'}
            <div class="error-message">Too many login attempts. Please try again later.</div>
        {/if}

        <div class="form-group">
            <input
                type="text"
                name="username"
                id="username"
                bind:value={formState.username}
                required
                autocomplete="username"
                placeholder="username"
            />
        </div>

        <div class="form-group">
            <input
                type="password"
                name="password"
                id="password"
                bind:value={formState.password}
                required
                autocomplete="current-password"
                placeholder="password"
            />
        </div>

        <button type="submit" class="login-button" disabled={formState.loading}>
            {#if formState.loading}
                <span class="loading-spinner"></span>
            {:else}
                login
            {/if}
        </button>
    </form>
</div>

<style>
    .login-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        width: 100%;
        max-width: 400px;
        text-align: center;
    }

    .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
    }

    input {
        width: 94%;
        padding: 0.75rem;
        border: 1px solid var(--light);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
    }

    input:focus {
        outline: none;
        border-color: var(--primary-light);
        box-shadow: 0 0 0 2px rgba(137, 176, 174, 0.3);
    }

    .login-button {
        width: 100%;
        padding: 0.75rem;
        background-color: var(--primary-light);
        color: var(--white);
        border: none;
        border-radius: var(--border-radius);
        font-size: 1rem;
        font-weight: 500;
        cursor: pointer;
        transition:
            background-color 0.2s,
            transform 0.1s;
        min-height: var(--min-touch-size, 44px);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .login-button:hover {
        background-color: var(--primary-dark);
    }

    .login-button:active {
        transform: scale(0.98);
    }

    .login-button:disabled {
        background-color: var(--light);
        color: var(--gray);
        cursor: not-allowed;
    }

    .error-message {
        background-color: rgba(255, 82, 82, 0.1);
        color: var(--error);
        padding: 0.75rem;
        border-radius: var(--border-radius);
        margin-bottom: 1.5rem;
        font-size: 0.9rem;
    }

    .loading-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid var(--white);
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
