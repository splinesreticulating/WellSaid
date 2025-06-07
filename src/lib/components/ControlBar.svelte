<script lang="ts">
// biome-ignore lint/style/useConst: Svelte 5 $props() pattern
let {
    lookBackAmount = $bindable(''),
    lookBackUnit = $bindable('hours'),
    messageCount,
    onclick,
    canGenerate,
    isLoading,
}: {
    lookBackAmount?: string
    lookBackUnit?: string
    messageCount: number
    onclick: () => void
    canGenerate: boolean
    isLoading: boolean
} = $props()

const amountOptions = ['1', '2', '3', '4', '5', '6', '12', '24']
const unitOptions = ['minutes', 'hours', 'days']
</script>

<section class="control-bar">
        <div class="timeframe-controls">
                <label for="window-amount">summarize last:</label>
                <select id="window-amount" bind:value={lookBackAmount}>
                        {#each amountOptions as val}
                                <option value={val}>{val}</option>
                        {/each}
                </select>
                <select id="window-unit" bind:value={lookBackUnit}>
                        {#each unitOptions as val}
                                <option value={val}>{val}</option>
                        {/each}
                </select>
                <button type="button" class="go-button" { onclick }  disabled={!canGenerate}>
			{#if isLoading}
				<span class="loading-spinner"></span>
			{:else}
				go
			{/if}
		</button>
	</div>
	<div class="message-count">
		<span class="message-count-value">{messageCount}</span> messages
	</div>
</section>

<style>
	.control-bar {
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		margin-bottom: 1rem;
	}

	.timeframe-controls {
		justify-content: space-between;
		display: flex;
		align-items: center;
		line-height: 1;
		flex-wrap: wrap;
	}

	.timeframe-controls label {
		font-weight: bold;
	}

	.go-button {
		background-color: var(--primary-dark);
		color: var(--white);
		border: 1px solid var(--primary-light);
		border-radius: var(--border-radius);
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s, transform 0.1s;
		min-height: var(--min-touch-size);
		min-width: var(--min-touch-size);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.go-button:hover {
		background-color: var(--primary-dark);
	}

	.go-button:active {
		transform: scale(0.98);
	}

	.go-button:disabled {
		background-color: var(--light);
		color: var(--gray);
		cursor: not-allowed;
		border-color: var(--light);
	}

	.loading-spinner {
		display: inline-block;
		width: 12px;
		height: 12px;
		border: 2px solid var(--white); /* Spinner color on button */
		border-radius: 50%;
		border-top-color: transparent;
		animation: spin 1s linear infinite;
	}

	.message-count {
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		color: var(--text-color);
		margin-top: 0.5rem;
	}

	.message-count-value {
		font-weight: 600;
		margin: 0 0.25rem;
	}

	/* Mobile */
	@media (max-width: 600px) {
		.control-bar {
			flex-direction: column;
			align-items: stretch;
		}
		.timeframe-controls {
			width: 100%;
			margin-bottom: 0.75rem;
		}
		.message-count {
			text-align: center;
			width: 100%;
			margin-top: 0;
		}
	}

	/* Desktop */
	@media (min-width: 768px) {
		.control-bar {
			align-items: center;
		}
		.timeframe-controls {
			gap: 1rem;
		}
		.message-count {
			margin-left: auto;
			align-items: center;
			justify-content: flex-end;
			text-align: right;
		}
	}
</style>
