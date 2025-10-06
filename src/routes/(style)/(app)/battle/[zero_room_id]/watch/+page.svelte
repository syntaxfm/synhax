<script lang="ts">
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { get_z } from '$lib/z';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';

	const z = get_z();

	let battle = new Query(
		z.query.battles
			.where('zero_room_id', page?.params?.zero_room_id || '')
			.one()
			.related('referee')
			.related('participants', (q) =>
				q.related('user').related('hax', (h) => h.related('votes'))
			)
			.related('target')
	);
</script>

{#if battle.current}
	{#if battle.current.visibility === 'PUBLIC'}
		<Header battle={battle.current}>
			{#snippet detail()}
				<p>Today's Referee: {battle?.current?.referee?.name}</p>
				<h3>{remove_screaming(battle?.current?.type || '')}</h3>
				<ShareLinks code={false} battle={battle.current} />
			{/snippet}
			{#snippet countdown()}
				{#if battle.current?.type === 'TIMED_MATCH'}
					<Countdown battle={battle.current} view="WATCH" />
				{/if}
			{/snippet}
		</Header>

		<Battlers battle={battle.current} results={true} />
	{:else}
		<div class="private">
			<p>This battle is private. Sorry.</p>
		</div>
	{/if}
{/if}

<!-- TODO code output -->

<style>
	.private {
		text-align: center;
		margin-block: 4rem;
	}
</style>
