<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	// import RefBanner from '$lib/battle_mode/RefBanner.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { get_z } from '$lib/z';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';

	const z = get_z();
	// import lobby_song from '$lib/media/moonlight.mp3';
	// const lobby_sound = new Audio(lobby_song);
	// lobby_sound.preload = 'auto';
	// lobby_sound.play();

	let battle = new Query(
		z.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) =>
				q.related('user').related('hax', (h) => h.related('votes'))
			)
			.related('target')
	);

	$effect(() => {
		if (battle?.current?.status === 'ACTIVE') {
			goto(`/battle/${page.params.id}/code`);
		}
	});
</script>

{#if battle.current}
	<Header battle={battle.current}>
		{#snippet detail()}
			<h3>{remove_screaming(battle?.current?.type || '')}</h3>
			<!-- <RefBanner battle={battle.current} /> -->
			<!-- <p>Today's Referee: {battle?.current?.referee?.name}</p> -->
			<ShareLinks battle={battle.current} code={false} />
		{/snippet}
		{#snippet countdown()}
			<div>
				{#if battle.current?.type === 'TIMED_MATCH'}
					<Countdown battle={battle.current} />
				{/if}
			</div>
		{/snippet}
	</Header>

	<Battlers battle={battle.current} join={true} />

	{#if battle?.current?.status === 'ACTIVE'}
		<p>Battle is currently active.</p>
		<a href={`/battle/${battle.current.id}/code`}>Go to Battle</a>
	{/if}
{/if}

<style>
	h3 {
		font-size: 30px;
		text-transform: capitalize;
	}
</style>
