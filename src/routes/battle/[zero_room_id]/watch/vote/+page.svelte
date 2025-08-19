<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z } from '$sync/client';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';

	let battle = new Query(
		z.current.query.battles
			.where('zero_room_id', page?.params?.zero_room_id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);
</script>

<header>
	<h2>Battle Voting</h2>
</header>

{#if battle.current && battle.current.visibility === 'PUBLIC'}
	<h4>The Target</h4>
	<img src={battle.current.target.image} alt="Battle Image" width="300" />
	<p>Today's Referee: {battle?.current?.referee?.name}</p>
	<h3>{remove_screaming(battle?.current?.type || '')}</h3>

	<h3>Who won the battle?</h3>
	<label for="winner">Most Accurate:</label>
	<wa-rating label="Rating" style="font-size: 2rem;" onchange={(e) => console.log(e.target.value)}
	></wa-rating>
	<label for="winner">Real World Code:</label>
	<wa-rating label="Rating" style="font-size: 2rem;" onchange={(e) => console.log(e.target.value)}
	></wa-rating>
	<label for="winner">Best Feel:</label>
	<wa-rating label="Rating" style="font-size: 2rem;" onchange={(e) => console.log(e.target.value)}
	></wa-rating>

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
