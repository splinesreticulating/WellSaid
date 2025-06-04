<script lang="ts">
import { goto } from '$app/navigation'
import { page } from '$app/stores'

const formState = $state({
    username: '',
    password: '',
    error: '',
    loading: false,
})

// Check for error query parameter
$effect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    if (errorParam === 'too_many_attempts') {
        formState.error = 'Too many login attempts. Please try again later.'
    }
})

$effect(() => {
    // Check if we're already logged in
    checkAuthStatus()
})

async function checkAuthStatus() {
    try {
        const response = await fetch('/api/auth/check')
        if (response.ok) {
            // Already authenticated, dispatch event and redirect to home
            const event = new CustomEvent('authchange', {
                detail: { authenticated: true }
            })
            window.dispatchEvent(event)
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
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: formState.username,
                password: formState.password,
            }),
        })

        if (response.ok) {
            // Authentication successful, dispatch event and redirect
            const event = new CustomEvent('authchange', {
                detail: { authenticated: true }
            })
            window.dispatchEvent(event)
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
    <title>Login</title>
</svelte:head>

    <div class="login-card">
        <form onsubmit={handleSubmit}>
            {#if formState.error}
                <div class="error-message">{formState.error}</div>
            {/if}
            
            <div class="form-group">
                <input 
                    type="text" 
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
        to { transform: rotate(360deg); }
    }
</style>
