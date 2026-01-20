<script lang="ts">
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import DiffEngine from '$lib/battle_mode/DiffEngine.svelte';
	import type { Battle, Hax, Target } from '$sync/schema';
	import { z, mutators } from '$lib/zero.svelte';
	import { parseTargetCode } from '$utils/code';
	type BattleWithParticipants = Battle & {
		target?: Target | null;
		participants?: readonly { hax?: Hax | null }[];
	};

	let { battle, hax }: { battle: BattleWithParticipants; hax: Hax } = $props();

	const targetImage = $derived(battle.target?.image ?? '');
	const isCodeTarget = $derived(battle.target?.type === 'CODE');
	const targetCode = $derived(parseTargetCode(battle.target?.inspo ?? ''));
	const targetFrameData = $derived({
		html: targetCode.html,
		css: targetCode.css
	});

	// Iframe reference for DiffEngine
	let iframeElement: HTMLIFrameElement | null = $state(null);
	let targetIframeElement: HTMLIFrameElement | null = $state(null);

	// DiffEngine reference to trigger comparisons
	let diffEngine: DiffEngine | null = $state(null);

	// Fixed dimensions for both panes (TODO: make configurable per target)
	const FRAME_WIDTH = 600;
	const FRAME_HEIGHT = 400;

	// Overlay state: 'off', 'app', or 'diff'
	type OverlayMode = 'off' | 'app' | 'diff';
	let overlayMode: OverlayMode = $state('off');
	let overlayOpacity = $state(50);

	const showOverlayControls = $derived(true);

	// Diff canvas for overlay (captured from DiffEngine)
	let diffCanvasSrc: string | null = $state(null);

	// Run diff for active and completed battles (so users can see their score)
	const diffEnabled = $derived(
		battle.status === 'ACTIVE' || battle.status === 'COMPLETED'
	);

	/**
	 * Handle perfect score (100% accuracy)
	 * For FIRST_TO_PERFECT: ends battle immediately with this hax as winner
	 * For VOTING: no action (battle continues, voting determines winner)
	 */
	function handlePerfectScore() {
		if (battle.status !== 'ACTIVE') return;

		// Only auto-end for FIRST_TO_PERFECT mode
		if (battle.win_condition !== 'FIRST_TO_PERFECT') {
			console.log(
				'🎯 Perfect score achieved! (Voting mode - battle continues)'
			);
			return;
		}

		console.log('🎯 Perfect score achieved! Ending battle - YOU WIN!');
		z.mutate(
			mutators.battles.update({
				id: battle.id,
				status: 'COMPLETED',
				ends_at: Date.now(),
				winner_hax_id: hax.id
			})
		).server.catch((error: unknown) => {
			console.error('Failed to end battle on perfect score:', error);
		});
	}

	/**
	 * Called when iframe finishes loading - triggers diff comparison
	 */
	function handleIframeLoad() {
		console.log('[BattleMode] Iframe loaded, triggering comparison');
		diffEngine?.triggerCompare();
	}

	function handleTargetLoad() {
		diffEngine?.triggerCompare();
	}

	/**
	 * Handle diff canvas update from DiffEngine
	 */
	function handleDiffCanvasUpdate(canvas: HTMLCanvasElement | null) {
		if (canvas) {
			diffCanvasSrc = canvas.toDataURL();
		}
	}

	/**
	 * Toggle overlay mode - cycles through modes or sets specific
	 */
	function setOverlay(mode: OverlayMode) {
		overlayMode = mode;
	}
</script>

<section class="battle-mode">
	<div class="output code-output">
		<h2 class="battle-header">
			<div class="battle-header__title">
				<span class="battle-header__label">App</span>
				<span class="battle-header__meta">{FRAME_WIDTH} × {FRAME_HEIGHT}</span>
			</div>
			<div class="battle-header__actions">
				<a
					class="battle-icon-button"
					target="_blank"
					href="/battle/{battle.id}/code/breakout"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
					>
						<title>launch</title>
						<g fill="none" stroke-linejoin="miter" stroke-linecap="butt">
							<line
								x1="11"
								y1="13"
								x2="22"
								y2="2"
								stroke="currentColor"
								stroke-miterlimit="10"
								stroke-width="2"
							/>
							<polyline
								points="14 2 22 2 22 10"
								stroke="currentColor"
								stroke-linecap="square"
								stroke-miterlimit="10"
								stroke-width="2"
							/>
							<path
								d="M9,4H4A2,2,0,0,0,2,6V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V15"
								stroke="currentColor"
								stroke-linecap="square"
								stroke-miterlimit="10"
								stroke-width="2"
							/>
						</g>
					</svg>
				</a>
			</div>
		</h2>
		<div class="battle-frame-shell">
			<div
				class="cluster battle-frame-layout"
				style="--gap: var(--pad-m); justify-content: center;"
			>
				<div
					class="battle-frame"
					style:width="{FRAME_WIDTH}px"
					style:height="{FRAME_HEIGHT}px"
				>
					<AppFrame {hax} bind:iframeElement onload={handleIframeLoad} />
				</div>
			</div>
		</div>
	</div>
	<div class="output">
		<h2 class="battle-header">
			<div class="battle-header__title">
				<span class="battle-header__label">Target</span>
			</div>
			<div class="battle-controls">
				{#if showOverlayControls}
					<div class="battle-control">
						<span class="battle-control__label">Overlay</span>
						<div class="cluster" style="--gap: 8px;">
							<button
								class="battle-chip"
								class:selected={overlayMode === 'app'}
								onclick={() =>
									setOverlay(overlayMode === 'app' ? 'off' : 'app')}
							>
								App
							</button>
							<button
								class="battle-chip"
								class:selected={overlayMode === 'diff'}
								onclick={() =>
									setOverlay(overlayMode === 'diff' ? 'off' : 'diff')}
							>
								Diff
							</button>
						</div>
					</div>
					<div class="battle-control">
						<span class="battle-control__label">Opacity</span>
						<div class="battle-opacity">
							<input
								type="range"
								class="battle-slider"
								min="0"
								max="100"
								bind:value={overlayOpacity}
								title="Overlay opacity: {overlayOpacity}%"
							/>
						</div>
					</div>
				{/if}
			</div>
		</h2>
		<div class="battle-frame-shell">
			<div
				class="battle-frame"
				style:width="{FRAME_WIDTH}px"
				style:height="{FRAME_HEIGHT}px"
			>
				{#if isCodeTarget}
					<div class="target-preview-layer">
						<AppFrame
							hax={targetFrameData}
							bind:iframeElement={targetIframeElement}
							onload={handleTargetLoad}
						/>
					</div>
				{:else}
					<img
						src={targetImage}
						alt="Battle Image"
						width={FRAME_WIDTH}
						height={FRAME_HEIGHT}
					/>
				{/if}

				<!-- Overlay layer -->
				{#if showOverlayControls}
					{#if overlayMode === 'app'}
						<div
							class="overlay app-overlay"
							style:opacity={overlayOpacity / 100}
						>
							<AppFrame {hax} />
						</div>
					{:else if overlayMode === 'diff' && diffCanvasSrc}
						<div
							class="overlay diff-overlay"
							style:opacity={overlayOpacity / 100}
						>
							<img src={diffCanvasSrc} alt="Diff overlay" />
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</div>

	<!-- DiffEngine: computes diff and saves to DB via Zero mutators -->
	<DiffEngine
		bind:this={diffEngine}
		contestantIframe={iframeElement}
		targetImageSrc={isCodeTarget ? null : targetImage}
		targetIframe={isCodeTarget ? targetIframeElement : null}
		haxId={hax.id}
		currentScore={hax.diff_score}
		compareWidth={FRAME_WIDTH}
		compareHeight={FRAME_HEIGHT}
		enabled={diffEnabled}
		onPerfectScore={handlePerfectScore}
		onDiffCanvasUpdate={handleDiffCanvasUpdate}
		debug={false}
	/>
</section>

<style>
	.battle-mode {
		display: grid;
		grid-template-rows: repeat(2, minmax(0, 1fr));
		height: 100%;
		min-height: 0;
	}

	:global(.splitpanes__splitter) {
		border-inline: var(--border);
	}

	.output {
		height: 100%;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	.code-output {
		height: 100%;
	}

	.battle-frame {
		flex-shrink: 0;
		overflow: hidden;
		position: relative;
	}

	.target-preview-layer,
	.target-code-layer {
		position: absolute;
		inset: 0;
	}

	.target-preview-layer {
		z-index: 0;
	}

	.target-code-layer {
		z-index: 1;
		overflow: auto;
		background: var(--black);
	}

	.target-code-layer :global(pre) {
		margin: 0;
	}

	a {
		margin-bottom: 0;
	}

	/* Overlay layers */
	.battle-frame {
		position: relative;
	}

	.overlay {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.app-overlay :global(iframe) {
		width: 100%;
		height: 100%;
		border: none;
	}

	.diff-overlay img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
