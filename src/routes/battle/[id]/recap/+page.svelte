<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z } from '$sync/client';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';
	import { BATTLE_RATINGS } from '$lib/constants';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Header from '$lib/battle_mode/Header.svelte';

	let battle = new Query(
		z.current.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user').related('hax', (h) => h.related('votes')))
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

{#if battle.current && battle.current.visibility === 'PUBLIC'}
	<Header battle={battle.current}>
		{#snippet detail()}
			<p>Today's Referee: {battle?.current?.referee?.name}</p>
			<h3>{remove_screaming(battle?.current?.type || '')}</h3>
			<ShareLinks code={false} watch={false} vote={true} battle={battle.current} />
		{/snippet}
		{#snippet countdown()}{/snippet}
	</Header>

	<h3>How did you like the battle?</h3>
	<!-- TODO important issue. Rating for wrong battle showing up -->

	{#each BATTLE_RATINGS as rating_type}
		<label for="winner">{rating_type}:</label>
		<wa-rating
			label="Rating"
			style="font-size: 2rem;"
			value={rating.current?.[rating_type] || 0}
			onchange={(e) => rate_battle(rating_type, e.target.value)}
		></wa-rating>
	{/each}

	<Battlers battle={battle.current} results={true} />
{/if}

<style>
	wa-rating {
		--symbol-color-active: var(--yellow);
	}
</style>
