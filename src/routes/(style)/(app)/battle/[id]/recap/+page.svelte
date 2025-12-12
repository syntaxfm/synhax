<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';
	import { BATTLE_RATINGS } from '$lib/constants';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import { compute_battle_scores } from '$utils/scores';

	let battle = z.createQuery(
		z.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) =>
				q.related('user').related('hax', (h) => h.related('votes'))
			)
			.related('target')
	);

	let rating = $derived.by(() =>
		z.createQuery(
			z.query.ratings
				.where(({ cmp, and }) =>
					and(
						cmp('user_id', z.userID),
						cmp('target_id', battle.data?.target?.id || '')
					)
				)
				.one()
				.related('user')
				.related('target')
		)
	);

	let scores = $derived(
		compute_battle_scores(battle.data?.participants || [])
	);

	function rate_battle(
		rating_type: (typeof BATTLE_RATINGS)[number],
		rating_value: number
	) {
		let new_rating: Partial<Record<(typeof BATTLE_RATINGS)[number], number>> = {
			[rating_type]: rating_value
		};

		z.mutate.ratings
			.upsert({
				id: rating.data?.id || crypto.randomUUID(),
				user_id: z.userID,
				target_id: battle.data?.target?.id || '',
				difficulty: rating.data?.difficulty || 0,
				creativity: rating.data?.creativity || 0,
				fun: rating.data?.fun || 0,
				coolness: rating.data?.coolness || 0,
				...new_rating
			})
			.catch((error) => {
				console.error('Error rating battle:', error);
				alert('Failed to submit rating. Please try again.');
			});
	}
</script>

{#if battle.data && battle.data.visibility === 'PUBLIC'}
	<Header battle={battle.data}>
		{#snippet detail()}
			<!-- <p>Today's Referee: {battle?.data?.referee?.name}</p>
			<h3>{remove_screaming(battle?.data?.type || '')}</h3> -->
			<ShareLinks
				code={false}
				watch={false}
				vote={true}
				battle={battle.data}
			/>
		{/snippet}
		{#snippet countdown()}
			<div>
				<h3>Rating</h3>
				<div class="ratings">
					{#each BATTLE_RATINGS as rating_type}
						<div class="rating">
							<label for="winner">{rating_type}:</label>
							<wa-rating
								label="Rating"
								style="font-size: 1.2rem;"
								value={rating.data?.[rating_type] || 0}
								onchange={(e) => rate_battle(rating_type, e.target.value)}
							></wa-rating>
						</div>
					{/each}
				</div>
			</div>{/snippet}
	</Header>

	<section class="recap">
		<Battlers battle={battle.data} results={true} {scores} />
	</section>
{/if}

<style>
	h3 {
		color: var(--white);
		background: var(--pink);
		display: inline-block;
		padding: 4px 10px;
	}
	label {
		font-size: 14px;
	}
	.ratings {
		display: grid;
		text-align: center;
		grid-template-columns: auto 1fr auto 1fr;
		grid-template-rows: auto 1fr;
		width: 500px;
		margin: 10px auto 0;
		gap: 5px;
		align-items: center;
		.rating {
			display: grid;
			grid-template-columns: subgrid;
			grid-column: 1 / 3;
			align-items: center;
			&:nth-child(even) {
				grid-column: 3/5;
			}
		}
	}
</style>
