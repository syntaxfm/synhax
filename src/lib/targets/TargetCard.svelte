<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import NewBattleButton from '$lib/battle_mode/NewBattleButton.svelte';
	import { type Rating, type Target } from '$sync/schema';

	const {
		target
	}: {
		target: Target & {
			ratings: readonly Rating[];
		};
	} = $props();

	const averaged_ratings = $derived.by(() => {
		if (target.ratings.length === 0) {
			return {
				difficulty: 0,
				creativity: 0,
				fun: 0,
				coolness: 0
			};
		}

		const totals = target.ratings.reduce(
			(acc, r) => ({
				difficulty: acc.difficulty + r.difficulty,
				creativity: acc.creativity + r.creativity,
				fun: acc.fun + r.fun,
				coolness: acc.coolness + r.coolness
			}),
			{ difficulty: 0, creativity: 0, fun: 0, coolness: 0 }
		);

		return {
			difficulty: totals.difficulty / target.ratings.length,
			creativity: totals.creativity / target.ratings.length,
			fun: totals.fun / target.ratings.length,
			coolness: totals.coolness / target.ratings.length
		};
	});
</script>

<article>
	<header>
		<h2 class="h5">{target.name}</h2>
	</header>
	<div class="frame">
		<img src={target.image} alt={target.name} />
	</div>
	<div class="ratings">
		<span>
			Difficulty:<wa-rating
				readonly
				value={averaged_ratings.difficulty}
				label="Rating"
				style="font-size: 1rem;"
			></wa-rating>
		</span>
		<span>
			Creativity:
			<wa-rating
				readonly
				value={averaged_ratings.creativity}
				label="Rating"
				style="font-size: 1rem;"
			></wa-rating>
		</span>
		<span>
			Fun:
			<wa-rating
				readonly
				value={averaged_ratings.fun}
				label="Rating"
				style="font-size: 1rem;"
			></wa-rating>
		</span>
		<span>
			Coolness:
			<wa-rating
				readonly
				value={averaged_ratings.coolness}
				label="Rating"
				style="font-size: 1rem;"
			></wa-rating>
		</span>
	</div>
	<NewBattleButton target_id={target.id} />
</article>

<style>
	.frame {
		overflow: hidden;
		width: 100%;
		position: relative;
		aspect-ratio: 16 / 9;
	}

	img {
		width: 100%;
		scale: 1.2;
		position: absolute;
		top: 50%;
		left: 50%;
		translate: -50% -50%;
	}
	.ratings {
		display: flex;
		text-align-last: left;
		flex-direction: column;
		gap: 0.5rem;
		font-weight: 900;
		padding: 10px;
		--symbol-color-active: var(--yellow);
		color: var(--white);
	}

	wa-rating {
		--symbol-color-active: var(--yellow);
	}
</style>
