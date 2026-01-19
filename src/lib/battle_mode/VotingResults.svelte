<script lang="ts">
	import type { ParticipantScore } from '$utils/scores';
	import { fly } from 'svelte/transition';

	const { score }: { score: ParticipantScore } = $props();
</script>

<div class="voting">
	<div class="vote score">
		<span class="label">Score:</span>
		<div class="digits" data-score={score.place}>
			{#each score.total_score.toFixed(2).toString().split('') as digit}
				{#key digit}
					<span class="digit" in:fly={{ y: 50, duration: 200 }}>{digit}</span>
				{/key}
			{/each}
		</div>
	</div>
	<p class="vote">
		<span class="label">Most Accurate:</span>
		{score.MOST_ACCURATE || 'N/A'}
	</p>

	<p class="vote">
		<span class="label">Real World:</span>
		{score.REAL_WORLD || 'N/A'}
	</p>
	<p class="vote">
		<span class="label">Best Feel:</span>
		{score.BEST_FEEL || 'N/A'}
	</p>
</div>

<style>
	.voting {
		padding: 10px;
		background: linear-gradient(to top, rgb(0 0 0 / 1), rgb(0 0 0 / 0));
		display: grid;
		gap: 10px;
		grid-template-columns: auto 1fr;
	}
	.vote {
		display: grid;
		width: 100%;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		align-items: end;
		line-height: 1;
	}
	.label {
		text-align: right;
		font-size: 14px;
		text-transform: capitalize;
	}
	.score {
		font-size: 64px;
		font-weight: 900;
	}

	.digits {
		overflow: hidden;
		display: flex;
		transform-origin: bottom left;
		transition: 0.2s ease scale;
		&[data-score='1'] {
			scale: 1.5;
		}
		&[data-score='2'] {
			scale: 1.3;
		}
	}
	.digit {
		display: block;
	}
</style>
