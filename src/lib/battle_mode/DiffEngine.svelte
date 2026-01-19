<script lang="ts">
	/**
	 * DiffEngine - Computes visual diff and saves score to database.
	 *
	 * This is a "write-only" component - it computes the diff score and
	 * persists it via Zero mutators. UI reads the score from Zero queries.
	 *
	 * Comparison is triggered by calling `triggerCompare()` - typically from
	 * the iframe's onload event to ensure content is fully rendered.
	 */
	import {
		compareElementToElement,
		compareElementToImage,
		captureElement
	} from '$utils/diff';
	import { z, mutators } from '$lib/zero.svelte';

	interface Props {
		/** The iframe containing the user's rendered output */
		contestantIframe: HTMLIFrameElement | null;
		/** URL of the target image to compare against */
		targetImageSrc?: string | null;
		/** Iframe containing the target output (for CODE targets) */
		targetIframe?: HTMLIFrameElement | null;
		/** Hax ID for persisting score */
		haxId: string;
		/** Current diff score from DB (to avoid unnecessary saves) */
		currentScore: number | null;
		/** Width to scale both images to for comparison */
		compareWidth: number;
		/** Height to scale both images to for comparison */
		compareHeight: number;
		/** Enable/disable comparison */
		enabled?: boolean;
		/** Callback when a perfect score (100%) is achieved */
		onPerfectScore?: () => void;
		/** Threshold for "perfect" score (default 100) */
		perfectScoreThreshold?: number;
		/** Show debug panel with captured images */
		debug?: boolean;
		/** Callback when diff canvas is updated (for overlay display) */
		onDiffCanvasUpdate?: (canvas: HTMLCanvasElement | null) => void;
	}

	let {
		contestantIframe,
		targetImageSrc,
		targetIframe = null,
		haxId,
		currentScore,
		compareWidth,
		compareHeight,
		enabled = true,
		onPerfectScore,
		perfectScoreThreshold = 100,
		debug = false,
		onDiffCanvasUpdate
	}: Props = $props();

	// Internal state (not exposed)
	let isComparing = $state(false);
	let perfectScoreTriggered = $state(false);

	// Debug state - captured images
	let debugContestantSrc = $state<string | null>(null);
	let debugTargetSrc = $state<string | null>(null);
	let debugDiffSrc = $state<string | null>(null);
	let debugLastScore = $state<number | null>(null);
	let debugCompareCount = $state(0);

	/**
	 * Get the capturable element from the iframe.
	 */
	function getIframeBody(iframe: HTMLIFrameElement | null): HTMLElement | null {
		if (!iframe) return null;
		try {
			return iframe.contentDocument?.body ?? null;
		} catch {
			return null;
		}
	}

	function getCaptureElement(): HTMLElement | null {
		return getIframeBody(contestantIframe);
	}

	function getTargetElement(): HTMLElement | null {
		return getIframeBody(targetIframe ?? null);
	}

	/**
	 * Perform comparison and save result to database.
	 * Exported so parent can call it when iframe finishes loading.
	 */
	export async function triggerCompare() {
		const element = getCaptureElement();
		const targetElement = getTargetElement();

		if (!enabled) {
			console.log('[DiffEngine] Comparison disabled');
			return;
		}

		if (isComparing) {
			console.log('[DiffEngine] Already comparing, skipping');
			return;
		}

		const hasTarget = Boolean(targetElement) || Boolean(targetImageSrc);

		if (!element || !hasTarget) {
			console.log('[DiffEngine] Skipping compare:', {
				hasElement: !!element,
				hasTarget
			});
			return;
		}

		isComparing = true;
		debugCompareCount++;
		console.log('[DiffEngine] Running comparison #', debugCompareCount);

		try {
			const result = targetElement
				? await compareElementToElement(element, targetElement, {
						compareWidth,
						compareHeight,
						threshold: 0.005
					})
				: await compareElementToImage(element, targetImageSrc ?? '', {
						compareWidth,
						compareHeight,
						threshold: 0.005
					});

			const newScore = Math.round(result.score);
			debugLastScore = newScore;

			// Notify parent of diff canvas update (for overlay display)
			onDiffCanvasUpdate?.(result.diffCanvas);

			// Capture debug images
			if (debug) {
				try {
					const contestantImg = await captureElement(element);
					debugContestantSrc = contestantImg.src;

					if (targetElement) {
						const targetImg = await captureElement(targetElement);
						debugTargetSrc = targetImg.src;
					} else if (targetImageSrc) {
						const targetImg = new Image();
						targetImg.crossOrigin = 'anonymous';
						targetImg.onload = () => {
							const canvas = document.createElement('canvas');
							canvas.width = targetImg.naturalWidth;
							canvas.height = targetImg.naturalHeight;
							const ctx = canvas.getContext('2d');
							ctx?.drawImage(targetImg, 0, 0);
							debugTargetSrc = canvas.toDataURL();
						};
						targetImg.src = targetImageSrc;
					}

					// Convert diff canvas to data URL
					debugDiffSrc = result.diffCanvas.toDataURL();
				} catch (e) {
					console.error('[DiffEngine] Debug capture failed:', e);
				}
			}

			// Only save if score changed by >= 1%
			if (currentScore === null || Math.abs(newScore - currentScore) >= 1) {
				console.log('[DiffEngine] Saving score:', newScore);
				z.mutate(
					mutators.hax.update({
						id: haxId,
						user_id: z.userID,
						diff_score: newScore
					})
				);
			}

			// Check for perfect score
			if (
				!perfectScoreTriggered &&
				result.score >= perfectScoreThreshold &&
				onPerfectScore
			) {
				console.log('[DiffEngine] Perfect score achieved!');
				perfectScoreTriggered = true;
				onPerfectScore();
			}
		} catch (err) {
			console.error('[DiffEngine] Comparison failed:', err);
		} finally {
			isComparing = false;
		}
	}
</script>

{#if debug}
	<div class="diff-debug">
		<h4>
			DiffEngine Debug (Compare #{debugCompareCount}, Score: {debugLastScore}%)
		</h4>
		<p class="debug-dimensions">Compare size: {compareWidth}×{compareHeight}</p>
		<div class="debug-images">
			<div>
				<p>Captured (contestant)</p>
				{#if debugContestantSrc}
					<img src={debugContestantSrc} alt="Captured contestant" />
				{:else}
					<p>Not captured yet</p>
				{/if}
			</div>
			<div>
				<p>Target</p>
				{#if debugTargetSrc}
					<img src={debugTargetSrc} alt="Target" />
				{:else}
					<p>Not loaded yet</p>
				{/if}
			</div>
			<div>
				<p>Diff heatmap</p>
				{#if debugDiffSrc}
					<img src={debugDiffSrc} alt="Diff heatmap" />
				{:else}
					<p>Not generated yet</p>
				{/if}
			</div>
		</div>
		<button onclick={() => triggerCompare()}>Force Compare</button>
	</div>
{/if}

<style>
	.diff-debug {
		position: fixed;
		bottom: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.9);
		color: white;
		padding: 10px;
		border-radius: 8px;
		font-size: 12px;
		z-index: 9999;
		max-width: 600px;
	}
	.diff-debug h4 {
		margin: 0 0 5px 0;
	}
	.debug-dimensions {
		margin: 0 0 10px 0;
		opacity: 0.7;
	}
	.debug-images {
		display: flex;
		gap: 10px;
	}
	.debug-images > div {
		flex: 1;
	}
	.debug-images img {
		max-width: 150px;
		max-height: 100px;
		border: 1px solid #444;
	}
	.debug-images p {
		margin: 0 0 5px 0;
		font-weight: bold;
	}
</style>
