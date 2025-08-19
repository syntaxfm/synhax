<script lang="ts">
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
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
	<h2>Battle Stands</h2>
</header>

{#if battle.current && battle.current.visibility === 'PUBLIC'}
	<h4>The Target</h4>
	<img src={battle.current.target.image} alt="Battle Image" width="300" />
	<p>Today's Referee: {battle?.current?.referee?.name}</p>
	<h3>{remove_screaming(battle?.current?.type || '')}</h3>
	{#if battle.current?.type === 'TIMED_MATCH'}
		<Countdown battle={battle.current} view="WATCH" />
	{/if}

	<ShareLinks code={false} battle={battle.current} />

	{#each battle.current?.participants as participant}
		<div>
			<img src={participant.user?.image} alt="" />
			<p>{participant.user.name} is {participant.status}</p>
		</div>
	{/each}
{/if}

<!-- TODO code output -->
