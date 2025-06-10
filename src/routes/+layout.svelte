<script lang="ts">
    import { goto } from '$app/navigation'
    import { page } from '$app/state'
    import type { Snippet } from 'svelte'
    import { onMount } from 'svelte'
    import '../app.css'
    import type { LayoutData } from './$types'

    const { children, data }: { children: Snippet; data: LayoutData } = $props()

    const authenticated = $derived(data.authenticated)
    const currentPath = $derived(page.url.pathname)

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
