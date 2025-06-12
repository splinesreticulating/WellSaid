<script lang="ts">
    import { page } from '$app/state'
    import type { Snippet } from 'svelte'
    import '../app.css'
    import type { LayoutData } from './$types'

    const { children, data }: { children: Snippet; data: LayoutData } = $props()

    const authenticated = $derived(data.authenticated)
    const currentPath = $derived(page.url.pathname)
</script>

{@render children()}

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
