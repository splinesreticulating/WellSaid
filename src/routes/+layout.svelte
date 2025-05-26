<script lang="ts">
import { browser } from '$app/environment'
import { goto } from '$app/navigation' // SvelteKit's navigation utility
import { page } from '$app/state' // SvelteKit's state-based page store (Svelte 5)

// biome-ignore lint/style/useConst: Svelte 5 $props pattern for layout children
let { children } = $props() // Svelte 5: Layouts receive content as 'children' prop

let authenticated = $state(false) // Svelte 5 state
let initialCheckLoading = $state(true) // Svelte 5 state for initial auth check status

// Performs the authentication check against the API
async function performAuthCheck() {
    if (!browser) return
    try {
        const response = await fetch('/api/auth/check')
        authenticated = response.ok
    } catch (err) {
        console.error('Auth check failed:', err)
        authenticated = false
    }
}

// Svelte 5 effect for initial data loading and reactive redirection
$effect(() => {
    if (browser) {
        const currentPath = page.url.pathname

        // If on login page or already authenticated, ensure loading is false and do nothing else.
        if (currentPath === '/login' || authenticated) {
            if (initialCheckLoading) {
                initialCheckLoading = false
            }
            return
        }

        // If not on /login and not authenticated, perform the full check.
        const performFullCheck = async () => {
            initialCheckLoading = true
            await performAuthCheck() // This updates 'authenticated' state
            initialCheckLoading = false

            // After the check, if still not authenticated and not on login page, redirect.
            // Re-check page.url.pathname as navigation might have occurred during await.
            if (!authenticated && page.url.pathname !== '/login') {
                goto('/login')
            }
        }

        performFullCheck()
    }
})
</script>

{#if page.url.pathname === '/login'}
    {@render children()} <!-- Call the children snippet function -->
{:else if initialCheckLoading}
    <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
        <p>Loading application...</p>
    </div>
{:else if authenticated}
    {@render children()} <!-- Call the children snippet function -->
{:else}
    <!-- This state should be brief due to the redirect effect. -->
    <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
        <p>Please wait...</p> 
    </div>
{/if}
