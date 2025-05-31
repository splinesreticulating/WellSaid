<script lang="ts">  
let { status, message } = $props()

$effect(() => {
    if (status === 401) {
        window.location.reload() // Force reload to show auth dialog
    }
})
</script>

<div class="error-container">
    <h1>{status}</h1>
    <p>{message}</p>
    <a href="/">(go back)</a>
</div>

<style>
    .error-container {
        max-width: 600px;
        margin: 5rem auto;
        padding: 2rem;
        text-align: center;
    }
    
    h1 {
        font-size: 4rem;
        margin-bottom: 1rem;
        color: var(--primary);
    }
    
    p {
        color: var(--primary);
        margin-bottom: 2rem;
    }
    
    a {
        color: var(--primary-light);
    }
</style>
