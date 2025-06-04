<script lang="ts">
import '../app.css'
import { onMount } from 'svelte'
import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { page } from '$app/state'

// biome-ignore lint/style/useConst: Svelte 5 $props pattern for layout children
let { children } = $props()
let authenticated = $state(false)
let initialCheckLoading = $state(true)

// Custom event type for auth changes
type AuthChangeEvent = CustomEvent<{ authenticated: boolean }>
const AUTH_CHANGE_EVENT = 'authchange'

// Function to dispatch auth change event
export function dispatchAuthChange(authenticated: boolean) {
    if (!browser) return
    
    const event = new CustomEvent(AUTH_CHANGE_EVENT, {
        detail: { authenticated }
    })
    window.dispatchEvent(event)
}

async function performAuthCheck() {
    if (!browser) return false

    try {
        const response = await fetch('/api/auth/check')
        const isAuthenticated = response.ok
        if (authenticated !== isAuthenticated) {
            authenticated = isAuthenticated
            dispatchAuthChange(isAuthenticated)
        }
        return isAuthenticated
    } catch (err) {
        console.error('Auth check failed:', err)
        if (authenticated) {
            authenticated = false
            dispatchAuthChange(false)
        }
        return false
    }
}

function handleAuthChange(event: AuthChangeEvent) {
    authenticated = event.detail.authenticated
    initialCheckLoading = false
    
    // If not authenticated and not on login page, redirect to login
    if (!authenticated && page.url.pathname !== '/login') {
        goto('/login')
    }
}

onMount(() => {
    if (!browser) return
    
    // Initial auth check
    const checkAuth = async () => {
        initialCheckLoading = true
        await performAuthCheck()
        initialCheckLoading = false
    }
    
    checkAuth()
    
    // Listen for auth change events
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange as EventListener)
    
    // Cleanup
    return () => {
        window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange as EventListener)
    }
})
</script>

{#if page.url.pathname === '/login'}
    {@render children()}
{:else if initialCheckLoading}
    <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
        <p>Reticulating splines...</p>
    </div>
{:else if authenticated}
    {@render children()}
{:else}
    <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
        <p>Reticulating splines...</p>
    </div>
{/if}

<footer>
    <p>(c) {new Date().getFullYear()} splinesreticulating</p>
</footer>

<style>
    footer {
        text-align: center;
        font-size: 0.8rem;
        color: var(--gray);
        font-family: var(--body-font);
    }
</style>
