<script lang="ts">
    import '../app.css'
    import { page } from '$app/state'
    import { goto } from '$app/navigation'
    import { onMount } from 'svelte'
    import type { LayoutData } from './$types'
    import type { Snippet } from 'svelte'

    const { children, data }: { children: Snippet; data: LayoutData } = $props()

    // Get authentication state from server
    const authenticated = $derived(data.authenticated)

    // Get current page info
    const currentPath = $derived(page.url.pathname)

    // Handle redirect for unauthenticated users
    onMount(() => {
        if (!authenticated && currentPath !== '/login') {
            goto('/login')
        }
    })
</script>

{#if currentPath === '/login' || authenticated}
    {@render children()}
{:else}
    <div style="text-align:center; margin-top: 5rem; padding: 1rem;">
        <p>Redirecting to login...</p>
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
