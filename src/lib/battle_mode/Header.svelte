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
		battlers = [],
		currentUserId = null
	}: {
		battle: Battle & { target?: Target | null };
		detail: Snippet;
		countdown: Snippet;
		target?: boolean;
		diffScore?: number | null;
		battlers?: Participant[];
		currentUserId?: string | null;
	} = $props();

	// Get the two battlers (for now, assuming 2 participants)
	const leftBattler = $derived(battlers[0]);
	const rightBattler = $derived(battlers[1]);

	// Determine who's winning (higher diff_score is better)
	const leftScore = $derived(leftBattler?.hax?.diff_score ?? 0);
	const rightScore = $derived(rightBattler?.hax?.diff_score ?? 0);
	const hasHeadToHead = $derived(Boolean(leftBattler && rightBattler));
	const leftIsWinning = $derived(
		hasHeadToHead && leftScore > rightScore && leftScore > 0
	);
	const rightIsWinning = $derived(
		hasHeadToHead && rightScore > leftScore && rightScore > 0
	);
	const WINNING_TEXT = $derived(
		battle.status === 'COMPLETED' ? 'WINNER' : 'WINNING'
	);
</script>

<header class:has-battlers={battlers.length > 0}>
	{#if battlers.length > 0}
		<!-- Battle mode header with progress bars -->
		<div class="battler-side left">
			{#if leftBattler?.user}
				<h3>
					{leftBattler.user.name}
					{#if hasHeadToHead && leftIsWinning}
						<span class="winning">{WINNING_TEXT}</span>
					{/if}
					{#if currentUserId && leftBattler.user_id === currentUserId}
						<span class="you">You!</span>
					{/if}
				</h3>
				<BattlerProgress
					user={leftBattler.user}
					hax={leftBattler.hax ?? null}
					position="left"
					color="var(--blue)"
				/>
			{/if}
		</div>
		<div class="clock-wrap">
			{@render countdown()}
			{#if diffScore !== null}
				<!-- <DiffPreview score={diffScore} compact /> -->
			{/if}
		</div>
		<div class="battler-side right">
			{#if rightBattler?.user}
				<h3>
					{#if currentUserId && rightBattler.user_id === currentUserId}
						<span class="you">You!</span>
					{/if}
					{#if hasHeadToHead && rightIsWinning}
						<span class="winning">{WINNING_TEXT}</span>
					{/if}
					{rightBattler.user.name}
				</h3>
				<BattlerProgress
					user={rightBattler.user}
					hax={rightBattler.hax ?? null}
					position="right"
					color="var(--red)"
				/>
			{/if}
		</div>
	{:else}
		<!-- Default header layout -->
		<div class="target">
			{#if target && battle.target}
				<img src={battle.target.image} alt="Battle Target" />
				<p>The Target</p>
			{/if}
		</div>
		<div>
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
		gap: 0;
		grid-template-columns: 1fr auto 1fr;
		box-shadow:
			0 5px 10px rgb(0 0 0 / 0.2),
			0 -1px 1px rgb(255 255 255 / 0.1) inset;
	}

	.clock-wrap {
		height: 100%;
		display: flex;
		align-items: center;
		& > :global(div) {
			height: 100%;
		}
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

	.detail {
		padding: 20px;
		text-align: right;
		font-size: 14px;
	}

	.battler-side {
		display: grid;
		grid-template-rows: auto auto;
		grid-template-columns: 100%;
		/* flex-direction: column; */
		justify-items: stretch;
		/* align-items: center; */
		min-width: 0;
		/* Allow avatar to overflow vertically */
		overflow: visible;
		gap: var(--pad-m);
		padding: var(--pad-m);

		h3 {
			width: 100%;
			color: var(--white);
			font-size: 20px;
			margin: 0;
			display: flex;
			align-items: center;
			gap: 10px;
		}
		.winning {
			color: #00ff00;
			font-size: 15px;
		}
		.you {
			color: var(--yellow);
			font-size: 15px;
		}
	}

	.battler-side.left {
		justify-content: flex-start;
		color: var(--black);
	}

	.battler-side.right {
		justify-content: flex-end;
		h3 {
			text-align: right;
			justify-content: end;
		}
	}
</style>
