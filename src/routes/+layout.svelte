<script lang="ts">
    import type { Snippet } from 'svelte'
    import '../app.css'

    const { children }: { children: Snippet } = $props()
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
