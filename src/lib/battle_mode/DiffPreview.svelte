<script lang="ts">
	/**
	 * DiffPreview - Displays the diff score and optional heatmap visualization.
	 *
	 * Uses Graffiti UI tag pattern for the score badge with color-coded states:
	 * - Green (--green): >= 80% match
	 * - Yellow (--yellow): 50-79% match
	 * - Red (--red): < 50% match
	 */

	interface Props {
		/** Similarity score 0-100 */
		score: number | null;
		/** Diff heatmap canvas (optional) */
		diffCanvas?: HTMLCanvasElement | null;
		/** Compact mode for inline display */
		compact?: boolean;
		/** Show the diff heatmap canvas */
		showHeatmap?: boolean;
	}

	let {
		score,
		diffCanvas = null,
		compact = false,
		showHeatmap = false
	}: Props = $props();

	// Determine color based on score
	const scoreColor = $derived.by(() => {
		if (score === null) return 'var(--gray)';
		if (score >= 80) return 'var(--green)';
		if (score >= 50) return 'var(--yellow)';
		return 'var(--red)';
	});

	// Format score for display
	const scoreDisplay = $derived(score !== null ? `${Math.round(score)}%` : '—');

	// Canvas container ref for appending the diff canvas
	let canvasContainer: HTMLDivElement | null = $state(null);

	// Append diff canvas when available
	$effect(() => {
		if (canvasContainer && diffCanvas && showHeatmap) {
			canvasContainer.innerHTML = '';
			diffCanvas.style.maxWidth = '100%';
			diffCanvas.style.height = 'auto';
			canvasContainer.appendChild(diffCanvas);
		}
	});
</script>

{#if compact}
	<!-- Compact inline badge -->
	<span class="tag" style:--tag-color={scoreColor}>
		{scoreDisplay} match
	</span>
{:else}
	<!-- Full preview with optional heatmap -->
	<div class="diff-preview">
		<div class="diff-header">
			<span class="diff-label">Accuracy</span>
			<span class="tag" style:--tag-color={scoreColor}>
				{scoreDisplay}
			</span>
		</div>

		{#if showHeatmap && diffCanvas}
			<div class="diff-heatmap" bind:this={canvasContainer}></div>
		{/if}
	</div>
{/if}

<style>
	.diff-preview {
		display: flex;
		flex-direction: column;
		gap: var(--pad-s);
	}

	.diff-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--pad-m);
	}

	.diff-label {
		font-size: var(--font-size-min);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-5);
	}

	.diff-heatmap {
		border-radius: var(--br-m);
		overflow: hidden;
		background: var(--fg-05);
	}

	.diff-heatmap :global(canvas) {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
