<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	// import RefBanner from '$lib/battle_mode/RefBanner.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';
	// import lobby_song from '$lib/media/moonlight.mp3';
	// const lobby_sound = new Audio(lobby_song);
	// lobby_sound.preload = 'auto';
	// lobby_sound.play();

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	$effect(() => {
		if (battle?.data?.status === 'ACTIVE') {
			goto(`/battle/${page.params.id}/code`);
		}
	});
</script>

{#if battle.data}
	<Header battle={battle.data}>
		{#snippet detail()}
			<h3>{remove_screaming(battle?.data?.type || '')}</h3>
			<!-- <RefBanner battle={battle.data} /> -->
			<!-- <p>Today's Referee: {battle?.data?.referee?.name}</p> -->
			<ShareLinks battle={battle.data} code={false} />
		{/snippet}
		{#snippet countdown()}
			<div>
				{#if battle.data?.type === 'TIMED_MATCH'}
					<Countdown battle={battle.data} />
				{/if}
			</div>
		{/snippet}
	</Header>

	<Battlers battle={battle.data} join={true} />

	{#if battle?.data?.status === 'ACTIVE'}
		<p>Battle is currently active.</p>
		<a href={`/battle/${battle.data.id}/code`}>Go to Battle</a>
	{/if}
{/if}

<style>
	h3 {
		font-size: 30px;
		text-transform: capitalize;
	}
</style>
