<script lang="ts">
export let lookBackHours: string
export let messageCount: number
export let onGoClick: () => void
export let canGenerate: boolean
export let isLoading: boolean

const lookBackOptions = [
    { value: '1', label: 'hour' },
    { value: '2', label: '2 hours' },
    { value: '3', label: '3 hours' },
    { value: '4', label: '4 hours' },
    { value: '5', label: '5 hours' },
    { value: '6', label: '6 hours' },
    { value: '12', label: '12 hours' },
    { value: '24', label: '24 hours' },
]
</script>

<section class="control-bar">
	<div class="timeframe-controls">
		<label for="window-back">summarize the last:</label>
		<select id="window-back" bind:value={lookBackHours}>
			{#each lookBackOptions as option (option.value)}
				<option value={option.value}>{option.label}</option>
			{/each}
		</select>
		<button type="button" class="go-button" on:click={onGoClick} disabled={!canGenerate}>
			{#if isLoading}
				<span class="loading-spinner"></span>
			{:else}
				Go
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
		font-weight: 500;
		white-space: nowrap;
	}

	.go-button {
		background-color: var(--primary);
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
		background-color: var(--primary-dark, #005f5f);
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
		color: var(--primary);
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
		.go-button {
			margin-left: 0.5rem;
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
