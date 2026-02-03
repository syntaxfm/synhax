<script lang="ts">
	import SeverityScale from '$lib/battle_mode/SeverityScale.svelte';
	import { FRAME_HEIGHT, FRAME_WIDTH } from '$lib/constants';

	interface Props {
		/** Data URL of the diff canvas image */
		diffCanvasSrc: string | null;
		/** Show the severity scale legend */
		showScale?: boolean;
		/** Label text */
		label?: string;
	}

	let {
		diffCanvasSrc,
		showScale = true,
		label = 'Diff'
	}: Props = $props();
</script>

<div class="diff-view" style="--frame-width: {FRAME_WIDTH}; --frame-height: {FRAME_HEIGHT};">
	{#if showScale}
		<div class="diff-header">
			<span class="diff-label">{label}</span>
			<SeverityScale />
		</div>
	{/if}

	<div class="diff-frame">
		{#if diffCanvasSrc}
			<img src={diffCanvasSrc} alt="Diff visualization" class="diff-image" />
		{:else}
			<div class="diff-placeholder">Computing diff...</div>
		{/if}
	</div>
</div>

<style>
	.diff-view {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.diff-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.diff-label {
		font-size: 0.75rem;
		color: var(--grey);
		text-transform: uppercase;
		letter-spacing: 0.12em;
		font-weight: 700;
	}

	.diff-frame {
		position: relative;
		overflow: hidden;
		background: var(--black);
		width: 100%;
		aspect-ratio: var(--frame-width) / var(--frame-height);
	}

	.diff-image {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.diff-placeholder {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-1);
		color: var(--grey);
		font-size: var(--font-s);
	}
</style>
