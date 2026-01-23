<script lang="ts">
	import type { Battle, Target, User, Hax } from '$sync/schema';
	import type { Snippet } from 'svelte';
	import DiffPreview from './DiffPreview.svelte';
	import BattlerProgress from './BattlerProgress.svelte';

	type Participant = {
		id: string;
		user_id: string;
		user: User | undefined;
		hax: Hax | undefined;
		color?: string;
	};

	const {
		battle,
		detail,
		countdown,
		target = true,
		diffScore = null,
		battlers = []
	}: {
		battle: Battle & { target?: Target | null };
		detail: Snippet;
		countdown: Snippet;
		target?: boolean;
		diffScore?: number | null;
		battlers?: Participant[];
	} = $props();

	// Get the two battlers (for now, assuming 2 participants)
	const leftBattler = $derived(battlers[0]);
	const rightBattler = $derived(battlers[1]);

	const leftColor = leftBattler?.color ?? 'var(--blue)';
	const rightColor = rightBattler?.color ?? 'var(--red)';
</script>

<header class:has-battlers={battlers.length > 0}>
	{#if battlers.length > 0}
		<!-- Battle mode header with progress bars -->
		<div class="battler-side left">
			{#if leftBattler?.user}
				<BattlerProgress
					user={leftBattler.user}
					hax={leftBattler.hax ?? null}
					position="left"
					color={leftColor}
				/>
			{/if}
		</div>
		<div class="center">
			{@render countdown()}
			{#if diffScore !== null}
				<!-- <DiffPreview score={diffScore} compact /> -->
			{/if}
		</div>
		<div class="battler-side right">
			{#if rightBattler?.user}
				<BattlerProgress
					user={rightBattler.user}
					hax={rightBattler.hax ?? null}
					position="right"
					color={rightColor}
				/>
			{/if}
		</div>
	{:else}
		<!-- Default header layout -->
		<div class="target">
			{#if target && battle.target}
				<img src={battle.target.image} alt="Battle Image" />
				<p>The Target</p>
			{/if}
		</div>
		<div class="center">
			{@render countdown()}
			{#if diffScore !== null}
				<DiffPreview score={diffScore} compact />
			{/if}
		</div>
		<div class="detail">
			{@render detail()}
		</div>
	{/if}
</header>

<style>
	header {
		display: grid;
		background: var(--black);
		gap: 20px;
		grid-template-columns: 1fr auto 1fr;
		box-shadow:
			0 5px 10px rgb(0 0 0 / 0.2),
			0 -1px 1px rgb(255 255 255 / 0.1) inset;
	}

	header.has-battlers {
		align-items: center;
	}

	.target {
		position: relative;
		p {
			background: var(--pink);
			position: absolute;
			font-weight: 900;
			top: 0;
			left: 0;
			padding: 4px 10px;
		}
		img {
			width: 100%;
			max-width: 200px;
		}
	}

	.center {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--pad-s);
	}

	.detail {
		padding: 20px;
		text-align: right;
		font-size: 14px;
	}

	.battler-side {
		display: flex;
		align-items: center;
		min-width: 0;
		/* Allow avatar to overflow vertically */
		overflow: visible;
	}

	.battler-side.left {
		justify-content: flex-start;
		color: var(--black);
	}

	.battler-side.right {
		justify-content: flex-end;
	}
</style>
