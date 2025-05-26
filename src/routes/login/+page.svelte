<script lang="ts">
    import { goto } from '$app/navigation'
    import { onMount } from 'svelte'
    import { page } from '$app/stores'
    
    const formState = $state({
        username: '',
        password: '',
        error: '',
        loading: false
    })
    
    // Check for error query parameter
    $effect(() => {
        const errorParam = $page.url.searchParams.get('error')
        if (errorParam === 'too_many_attempts') {
            formState.error = 'Too many login attempts. Please try again later.'
        }
    })
    
    onMount(() => {
        // Check if we're already logged in
        checkAuthStatus()
    })
    
    async function checkAuthStatus() {
        try {
            const response = await fetch('/api/auth/check')
            if (response.ok) {
                // Already authenticated, redirect to home
                goto('/')
            }
            // If response is 401, that's expected (user not logged in)
            // Just stay on the login page
        } catch (error) {
            console.error('Error checking auth status:', error)
        }
    }
    
    async function handleSubmit(event: Event) {
        event.preventDefault()
        formState.loading = true
        formState.error = ''
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formState.username,
                    password: formState.password
                })
            })
            
            if (response.ok) {
                // Authentication successful
                goto('/')
            } else {
                const data = await response.json()
                formState.error = data.error || 'Invalid username or password'
            }
        } catch (error) {
            console.error('Login error:', error)
            formState.error = 'An error occurred during login'
        } finally {
            formState.loading = false
        }
    }
</script>

<svelte:head>
    <title>Login | WellSaid</title>
</svelte:head>

<main class="login-container">
    <div class="login-card">
        <h1>WellSaid</h1>
        <p class="tagline">Empathy. Upgraded.</p>
        
        <form onsubmit={handleSubmit}>
            {#if formState.error}
                <div class="error-message">{formState.error}</div>
            {/if}
            
            <div class="form-group">
                <label for="username">Username</label>
                <input 
                    type="text" 
                    id="username" 
                    bind:value={formState.username} 
                    required 
                    autocomplete="username"
                />
            </div>
            
            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    bind:value={formState.password} 
                    required 
                    autocomplete="current-password"
                />
            </div>
            
            <button type="submit" class="login-button" disabled={formState.loading}>
                {#if formState.loading}
                    <span class="loading-spinner"></span>
                {:else}
                    Login
                {/if}
            </button>
        </form>
    </div>
</main>

<style>
    /* Login Page Styles */
    .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 1rem;
        background-color: var(--light);
    }
    
    .login-card {
        background-color: var(--white);
        border-radius: var(--border-radius);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 2rem;
        width: 100%;
        max-width: 400px;
        text-align: center;
    }
    
    h1 {
        font-family: var(--header-font);
        font-size: 2.5rem;
        color: var(--primary);
        margin-bottom: 0.5rem;
    }
    
    .tagline {
        font-style: italic;
        color: var(--gray);
        margin-bottom: 2rem;
    }
    
    .form-group {
        margin-bottom: 1.5rem;
        text-align: left;
    }
    
    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--primary);
    }
    
    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--light);
        border-radius: var(--border-radius);
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
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
        transition: background-color 0.2s, transform 0.1s;
        min-height: var(--min-touch-size, 44px);
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .login-button:hover {
        background-color: var(--primary);
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
        to { transform: rotate(360deg); }
    }
</style>
