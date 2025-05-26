<script lang="ts">
import { browser } from '$app/environment'
import { onMount } from 'svelte'
import { page } from '$app/stores' // ADDED: Import page store to access URL

let authenticated = false
let loading = true
let error: string | null = null

async function checkAuth() {
    if (!browser) return

    try {
        const response = await fetch('/api/auth/check')
        authenticated = response.ok
    } catch (err) {
        console.error('Auth check failed:', err)
        error = 'Failed to check authentication status'
        authenticated = false
    } finally {
        loading = false
    }
}

async function handleLogout() {
    try {
        // Clear basic auth credentials
        await fetch('/api/auth/logout', { method: 'POST' })
        // Force reload to clear any cached credentials
        window.location.reload()
    } catch (err) {
        console.error('Logout failed:', err)
        error = 'Logout failed. Please try again.'
    }
}

onMount(() => {
    checkAuth()
})
</script>

{#if $page.url.pathname === '/login'}
    <slot /> <!-- Always render the login page content if on /login -->
{:else if loading}
    <div class="auth-required" style="text-align:center; margin-top: 5rem;">
        <p>Loading application...</p> <!-- Show loading for other pages -->
    </div>
{:else if !authenticated}
    <div class="auth-required">
        <h1>Authentication Required</h1>
        <p>Please sign in to access this application.</p>
        {#if error}
            <p class="error">{error}</p>
        {/if}
    </div>
{:else} <!-- Authenticated and not on the login page -->
    <nav>
        <div class="user-info">
            <span>Welcome, {import.meta.env.VITE_BASIC_AUTH_USERNAME || 'User'}</span>
            <button on:click={handleLogout}>Sign Out</button>
        </div>
    </nav>
    <slot />
{/if}

<style>
    .auth-required {
        max-width: 600px;
        margin: 5rem auto;
        padding: 2rem;
        text-align: center;
    }
    
    nav {
        background: #f5f5f5;
        padding: 1rem;
        margin-bottom: 2rem;
    }
    
    .user-info {
        max-width: 1200px;
        margin: 0 auto;
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1rem;
    }
    
    button {
        padding: 0.5rem 1rem;
        background: #333;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    button:hover {
        background: #555;
    }
    
    .error {
        color: #d32f2f;
        margin-top: 1rem;
        padding: 0.5rem;
        background-color: #ffebee;
        border-radius: 4px;
        display: inline-block;
    }
</style>
