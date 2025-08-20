<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z } from '$sync/client';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';
	import Battlers from '$lib/battle_mode/Battlers.svelte';

	let battle = new Query(
		z.current.query.battles
			.where('zero_room_id', page?.params?.zero_room_id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user').related('hax'))
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

	<ShareLinks code={false} battle={battle.current} watch={false} vote={true} />

	<Battlers battle={battle.current} votes={true} />
{/if}

<!-- TODO ratings can happen after hacks -->
