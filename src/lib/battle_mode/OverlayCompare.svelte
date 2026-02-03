<script lang="ts">
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import { FRAME_HEIGHT, FRAME_WIDTH } from '$lib/constants';

	type HaxData = {
		html?: string | null;
		css?: string | null;
	};

	type TargetData = {
		image?: string | null;
		type?: string | null;
		frameData?: HaxData;
	};

	interface Props {
		/** The contestant's hax data to overlay */
		hax: HaxData;
		/** Target data (image URL or code frame data) */
		target: TargetData;
		/** Show opacity slider control */
		showControls?: boolean;
		/** Opacity value (20-100), bindable for external control */
		opacity?: number;
		/** Mask X position (10-100), bindable for external control */
		maskX?: number;
		/** Mask Y position (10-100), bindable for external control */
		maskY?: number;
	}

	let {
		hax,
		target,
		showControls = true,
		opacity = $bindable(50),
		maskX = $bindable(100),
		maskY = $bindable(100)
	}: Props = $props();

	const isCodeTarget = $derived(target.type === 'CODE');

	let isPointerDown = $state(false);

	function handlePointerDown(event: PointerEvent) {
		isPointerDown = true;
		(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
		updateMaskFromPointer(event);
	}

	function handlePointerUp(event: PointerEvent) {
		isPointerDown = false;
		(event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
	}

	function handlePointerMove(event: PointerEvent) {
		if (!isPointerDown) return;
		updateMaskFromPointer(event);
	}

	function updateMaskFromPointer(event: PointerEvent) {
		const el = event.currentTarget as HTMLElement;
		const rect = el.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const percentageX = Math.round((x / rect.width) * 100);
		const percentageY = Math.round((y / rect.height) * 100);
		maskX = Math.max(10, Math.min(100, percentageX));
		maskY = Math.max(10, Math.min(100, percentageY));
	}
</script>

<div
	class="overlay-compare"
	style="--frame-width: {FRAME_WIDTH}px; --frame-height: {FRAME_HEIGHT}px; --aspect-w: {FRAME_WIDTH}; --aspect-h: {FRAME_HEIGHT};"
>
	{#if showControls}
		<div class="overlay-controls">
			<label class="control-row">
				<span class="control-label">Opacity</span>
				<input
					type="range"
					class="battle-slider"
					min="20"
					max="100"
					bind:value={opacity}
				/>
				<span class="control-value">{opacity}%</span>
			</label>
		</div>
	{/if}

	<div class="overlay-frame">
		<!-- Target layer -->
		{#if isCodeTarget && target.frameData}
			<AppFrame
				hax={{
					html: target.frameData.html ?? '',
					css: target.frameData.css ?? ''
				}}
				disableInspect={true}
			/>
		{:else if target.image}
			<img src={target.image} alt="Target" class="overlay-target-img" />
		{/if}

		<!-- Contestant overlay -->
		<div
			class="overlay app-overlay"
			style:opacity={opacity / 100}
			style:clip-path="inset(0 {100 - maskX}% {100 - maskY}% 0)"
		>
			<AppFrame hax={{ html: hax.html ?? '', css: hax.css ?? '' }} />
		</div>

		<!-- Mask edge indicator -->
		<div
			class="mask-edge-indicator"
			style:width="{maskX}%"
			style:height="{maskY}%"
		></div>

		<!-- Interaction layer for mask control -->
		<div
			class="overlay-interaction-layer"
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			role="slider"
			aria-label="Mask slider"
			aria-valuenow={maskX}
			tabindex="-1"
		></div>
	</div>
</div>

<style>
	.overlay-compare {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.overlay-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.control-label {
		font-size: 0.75rem;
		color: var(--grey);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.control-value {
		font-size: 0.75rem;
		color: var(--fg);
		min-width: 36px;
		text-align: right;
	}

	.battle-slider {
		width: 80px;
	}

	.overlay-frame {
		position: relative;
		overflow: hidden;
		background: var(--black);
		width: 100%;
		aspect-ratio: var(--aspect-w) / var(--aspect-h);
		container: overlay-frame / inline-size;
	}

	/* Scale the target iframe to fit container */
	.overlay-frame > :global(.frame-container) {
		width: 100%;
		height: 100%;
	}

	.overlay-frame > :global(.frame-container) :global(iframe) {
		width: var(--frame-width);
		height: var(--frame-height);
		transform-origin: top left;
		scale: calc(100cqi / var(--frame-width));
	}

	.overlay-target-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
		display: block;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	/* Overlay frame-container fills the clipped overlay div */
	.app-overlay :global(.frame-container) {
		width: 100%;
		height: 100%;
	}

	/* Overlay iframe - same scaling as target */
	.app-overlay :global(.frame-container) :global(iframe) {
		width: var(--frame-width);
		height: var(--frame-height);
		transform-origin: top left;
		scale: calc(100cqi / var(--frame-width));
	}

	.mask-edge-indicator {
		position: absolute;
		top: 0;
		left: 0;
		--color: rgba(255, 255, 255, 0.2);
		border-right: 1px solid var(--color);
		border-bottom: 1px solid var(--color);
		pointer-events: none;
		z-index: 5;
		box-shadow: 0 0 10px 1px rgba(0, 0, 0, 0.2);
	}

	.overlay-interaction-layer {
		position: absolute;
		inset: 0;
		z-index: 10;
		cursor: move;
	}
</style>
