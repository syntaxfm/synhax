<script lang="ts">
	import Modal from '$lib/ui/Modal.svelte';

	let { open = $bindable(false), onComplete } = $props<{
		open: boolean;
		onComplete?: () => void;
	}>();

	let isGenerating = $state(false);
	let error = $state('');

	async function handleGenerate() {
		isGenerating = true;
		error = '';
		try {
			const res = await fetch('/api/avatar/generate', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to generate avatar');
			}

			// Success! Close modal and call onComplete
			open = false;
			if (onComplete) onComplete();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate avatar';
		} finally {
			isGenerating = false;
		}
	}

	async function handleSkip() {
		error = '';
		try {
			const res = await fetch('/api/avatar/skip', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to skip avatar');
			}

			// Success! Close modal and call onComplete
			open = false;
			if (onComplete) onComplete();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to skip avatar';
		}
	}
</script>

<Modal bind:open title="Welcome to SynHax!">
	<div class="welcome-content">
		<p>
			Welcome to SynHax - the ultimate competitive CSS/HTML coding battle platform! Here, you'll
			face off against other developers in timed battles to replicate UI targets while others watch
			live.
		</p>

		<p>
			<strong>How it works:</strong> Compete as a battler, watch as a viewer, or control the action
			as a referee. After each battle, vote on awards like Most Accurate, Real World, and Best Feel
			in our Mario Party-style ceremony!
		</p>

		<p class="avatar-prompt">Let's start by creating your anime avatar:</p>

		{#if error}
			<p class="error">{error}</p>
		{/if}

		<div class="button-group">
			<button onclick={handleGenerate} disabled={isGenerating} class="generate-btn">
				{isGenerating ? 'Generating...' : 'Generate Avatar'}
			</button>
			<button onclick={handleSkip} disabled={isGenerating} class="skip-btn"> Skip </button>
		</div>

		{#if isGenerating}
			<p class="loading">
				Creating your unique anime avatar... This may take up to 30 seconds.
			</p>
		{/if}
	</div>
</Modal>

<style>
	.welcome-content {
		max-width: 600px;
		margin: 0 auto;
	}

	p {
		margin-bottom: 1.5rem;
		line-height: 1.6;
		text-align: left;
	}

	.avatar-prompt {
		font-weight: 700;
		color: var(--hot);
		margin-top: 2rem;
		text-align: center;
	}

	.button-group {
		display: flex;
		gap: 1rem;
		justify-content: center;
		margin-top: 2rem;
	}

	button {
		padding: 1rem 2rem;
		font-size: 1.2rem;
		font-weight: 900;
		text-transform: uppercase;
		border: 3px solid var(--white);
		cursor: pointer;
		transition:
			all 0.2s ease,
			transform 0.1s ease;
		color: var(--white);
	}

	button:hover:not(:disabled) {
		transform: scale(1.05);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.generate-btn {
		background: var(--hot);
	}

	.skip-btn {
		background: var(--gray);
	}

	.error {
		color: var(--hot);
		font-weight: 700;
		text-align: center;
		margin-top: 1rem;
	}

	.loading {
		text-align: center;
		font-style: italic;
		color: var(--hot);
		margin-top: 1rem;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
</style>
