<script lang="ts">
import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { page } from '$app/state'

// biome-ignore lint/style/useConst: Svelte 5 $props pattern for layout children
let { children } = $props()
let authenticated = $state(false)
let initialCheckLoading = $state(true)

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

// For initial data loading and reactive redirection
$effect(() => {
    if (browser) {
        const currentPath = page.url.pathname

        // If on login page or already authenticated, ensure loading is false and do nothing else.
        if (currentPath === '/login' || authenticated) {
            initialCheckLoading = false
            return
        }

        // If not on /login and not authenticated, perform the full check.
        const performFullCheck = async () => {
            initialCheckLoading = true
            await performAuthCheck() // This updates 'authenticated'
            initialCheckLoading = false

            // After the check, if still not authenticated and not on login page, redirect.
            if (!authenticated && page.url.pathname !== '/login') {
                goto('/login')
            }
        }

        performFullCheck()
    }
})
</script>
    
    {#if page.url.pathname === '/login'}
        {@render children()}
    {:else if initialCheckLoading}
        <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
            <p>Loading application...</p>
        </div>
    {:else if authenticated}
        {@render children()}
    {:else}
        <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
            <p>Please wait...</p>
        </div>
    {/if}