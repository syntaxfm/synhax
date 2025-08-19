<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z } from '$sync/client';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';
	import { BATTLE_RATINGS } from '$lib/constants';

	let battle = new Query(
		z.current.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);

	let rating = $derived.by(
		() =>
			new Query(
				z.current.query.ratings
					.where('user_id', z.current.userID)
					.one()
					.related('user')
					.related('target')
			)
	);

	function rate_battle(rating_type: (typeof BATTLE_RATINGS)[number], rating_value: number) {
		let new_rating: Partial<Record<(typeof BATTLE_RATINGS)[number], number>> = {
			[rating_type]: rating_value
		};

		z.current.mutate.ratings
			.upsert({
				id: rating.current?.id || crypto.randomUUID(),
				user_id: z.current.userID,
				target_id: battle.current?.target?.id || '',
				difficulty: rating.current?.difficulty || 0,
				creativity: rating.current?.creativity || 0,
				fun: rating.current?.fun || 0,
				coolness: rating.current?.coolness || 0,
				...new_rating
			})
			.catch((error) => {
				console.error('Error rating battle:', error);
				alert('Failed to submit rating. Please try again.');
			});
	}
</script>

<header>
	<h2>Battle Recap</h2>
</header>

{#if battle.current && battle.current.visibility === 'PUBLIC'}
	<h4>The Target</h4>
	<img src={battle.current.target.image} alt="Battle Image" width="300" />
	<p>Today's Referee: {battle?.current?.referee?.name}</p>
	<h3>{remove_screaming(battle?.current?.type || '')}</h3>
	<h3>How did you like the battle?</h3>

	{#each BATTLE_RATINGS as rating_type}
		<label for="winner">{rating_type}:</label>
		<wa-rating
			label="Rating"
			style="font-size: 2rem;"
			value={rating.current?.[rating_type] || 0}
			onchange={(e) => rate_battle(rating_type, e.target.value)}
		></wa-rating>
	{/each}

	<ShareLinks code={false} battle={battle.current} />

	{#each battle.current?.participants as participant}
		<div>
			<img src={participant.user?.image} alt="" />
			<p>{participant.user.name} is {participant.status}</p>
		</div>
	{/each}

	{#if battle?.current?.status === 'ACTIVE'}
		<p>Battle is currently active.</p>
	{:else if battle?.current?.status === 'COMPLETED'}
		<p>This battle has finished</p>
		<a href={`/battle/${battle.current.id}/recap`}>See the results</a>
	{/if}
{/if}

<!-- TODO code output -->
