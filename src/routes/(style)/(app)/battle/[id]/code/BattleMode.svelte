<script lang="ts">
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import DiffEngine from '$lib/battle_mode/DiffEngine.svelte';
	import SeverityScale from '$lib/battle_mode/SeverityScale.svelte';
	import type { Battle, Hax, Target, User, Participants } from '$sync/schema';
	import { z, mutators } from '$lib/zero.svelte';
	import { parseTargetCode } from '$utils/code';

	type ParticipantWithRelations = Participants & {
		user?: User | null;
		hax?: Hax | null;
	};

	type BattleWithParticipants = Battle & {
		target?: Target | null;
		participants?: readonly ParticipantWithRelations[];
	};

	let { battle, hax }: { battle: BattleWithParticipants; hax: Hax } = $props();

	// Get competitors (other participants, not the current user)
	const competitors = $derived.by(() => {
		const participants = battle.participants ?? [];
		return participants
			.filter((p) => p.hax && p.hax.id !== hax.id)
			.map((p) => ({
				id: p.id,
				user: p.user,
				hax: p.hax!,
				display_order: p.display_order ?? 0
			}))
			.sort((a, b) => a.display_order - b.display_order);
	});

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
	const PANEL_SCALE = 0.66;

	// Overlay state: 'off', 'app', or 'diff'
	type OverlayMode = 'off' | 'app' | 'diff';
	let overlayMode: OverlayMode = $state('off');
	let overlayOpacity = $state(50);

	const showOverlayControls = $derived(true);

	// Test
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
			<div class="battle-header-title">
				<span class="battle-header-label">Your App</span>
				<span class="battle-header-meta">{FRAME_WIDTH} × {FRAME_HEIGHT}</span>
			</div>
			<div class="battle-header-actions">
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
			<div class="battle-header-title">
				<span class="battle-header-label">Target</span>
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
							disableInspect={true}
							hax={targetFrameData}
							bind:iframeElement={targetIframeElement}
							onload={handleTargetLoad}
						/>
					</div>
				{:else}
					<img
						src={targetImage}
						alt="Battle target"
						width={FRAME_WIDTH}
						height={FRAME_HEIGHT}
					/>
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
		debug={true}
	/>

	<!-- Bottom panels section -->
	<div class="bottom-panels">
		<!-- Overlay View panel with preview -->
		<div class="control-panel">
			<h2 class="battle-header">
				<div class="battle-header-title">
					<span class="battle-header-label">Overlay</span>
				</div>
				<div class="battle-header-actions">
					<div class="control-row">
						<input
							type="range"
							class="battle-slider"
							min="0"
							max="100"
							bind:value={overlayOpacity}
							title="Overlay opacity: {overlayOpacity}%"
						/>
						<span class="control-value">{overlayOpacity}%</span>
					</div>
				</div>
			</h2>
			<div class="panel-preview">
				<div
					class="panel-frame-container"
					style:width="{FRAME_WIDTH * PANEL_SCALE}px"
					style:height="{FRAME_HEIGHT * PANEL_SCALE}px"
				>
					<div
						class="battle-frame panel-frame"
						style:width="{FRAME_WIDTH}px"
						style:height="{FRAME_HEIGHT}px"
						style:transform="scale({PANEL_SCALE})"
					>
						<!-- Target layer -->
						{#if isCodeTarget}
							<AppFrame hax={targetFrameData} />
						{:else}
							<img
								src={targetImage}
								alt="Target"
								width={FRAME_WIDTH}
								height={FRAME_HEIGHT}
							/>
						{/if}
						<!-- App overlay -->
						<div
							class="overlay app-overlay"
							style:opacity={overlayOpacity / 100}
						>
							<AppFrame {hax} />
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Diff View panel with preview -->
		<div class="control-panel">
			<h2 class="battle-header">
				<div class="battle-header-title">
					<span class="battle-header-label">Diff</span>
				</div>
				<div class="battle-header-actions">
					<SeverityScale />
				</div>
			</h2>
			<div class="panel-preview">
				<div
					class="panel-frame-container"
					style:width="{FRAME_WIDTH * PANEL_SCALE}px"
					style:height="{FRAME_HEIGHT * PANEL_SCALE}px"
				>
					<div
						class="battle-frame panel-frame"
						style:width="{FRAME_WIDTH}px"
						style:height="{FRAME_HEIGHT}px"
						style:transform="scale({PANEL_SCALE})"
					>
						{#if diffCanvasSrc}
							<img
								class="diff-image"
								src={diffCanvasSrc}
								alt="Diff visualization"
							/>
						{:else}
							<div class="diff-placeholder">Computing diff...</div>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<!-- Competitors section -->
		<div class="control-panel">
			<h2 class="battle-header">
				<div class="battle-header-title">
					<span class="battle-header-label">
						{#if competitors.length === 1}
							{competitors[0].user?.name ?? 'Competitor'}
						{:else}
							Competitors
						{/if}
					</span>
				</div>
			</h2>
			{#if competitors.length > 0}
				<div class="competitors-frames">
					{#each competitors as competitor (competitor.id)}
						<div class="competitor-frame-wrapper">
							{#if competitors.length > 1}
								<div class="competitor-name">
									{competitor.user?.name ?? 'Unknown'}
								</div>
							{/if}
							<div
								class="panel-frame-container"
								style:width="{FRAME_WIDTH * PANEL_SCALE}px"
								style:height="{FRAME_HEIGHT * PANEL_SCALE}px"
							>
								<div
									class="battle-frame panel-frame"
									style:width="{FRAME_WIDTH}px"
									style:height="{FRAME_HEIGHT}px"
									style:transform="scale({PANEL_SCALE})"
								>
									<AppFrame hax={competitor.hax} />
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="panel-empty">No competitors yet</div>
			{/if}
		</div>
	</div>
</section>

<style>
	.battle-mode {
		display: grid;
		/* grid-template-rows: repeat(2, minmax(0, 1fr)); */
		grid-template-columns: 1fr 1fr;
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

	.battle-frame-shell {
		padding: 0;
	}

	.target-preview-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	a {
		margin-bottom: 0;
	}

	/* Overlay styles */
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

	/* Bottom panels section */
	.bottom-panels {
		grid-column: 1 / -1;
		display: flex;
		padding: 0;
		border-top: var(--border);
		background: var(--bg-1);
		align-items: flex-start;
	}

	.control-panel {
		display: flex;
		flex-direction: column;
		background: var(--bg-2);
		border: var(--border);
		border-radius: var(--radius-m);
		flex: 1;
		min-width: 0;
	}

	.control-panel .battle-header {
		border-bottom: var(--border);
		padding: var(--pad-s) var(--pad-m);
	}

	.control-row {
		display: flex;
		align-items: center;
		gap: var(--pad-s);
	}

	.control-label {
		font-size: var(--font-s);
		color: var(--grey);
	}

	.control-value {
		font-size: var(--font-s);
		color: var(--fg);
		min-width: 36px;
		text-align: right;
	}

	.battle-slider {
		width: 80px;
	}

	/* Panel preview frames */
	.panel-preview {
		display: flex;
		justify-content: center;
		padding: 0;
	}

	.panel-frame-container {
		overflow: hidden;
		border: 1px solid var(--grey-dark);
		border-radius: var(--radius-s);
	}

	.panel-frame {
		flex-shrink: 0;
		overflow: hidden;
		position: relative;
		transform-origin: top left;
	}

	/* Diff panel styles */
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

	/* Panel empty state */
	.panel-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--pad-l);
		color: var(--grey);
		font-size: var(--font-s);
	}

	.competitors-frames {
		display: flex;
		gap: var(--pad-m);
		padding: 0;
		justify-content: center;
		flex-wrap: wrap;
	}

	.competitor-frame-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--pad-s);
	}

	.competitor-name {
		font-size: var(--font-s);
		color: var(--grey);
		font-weight: 500;
	}
</style>
