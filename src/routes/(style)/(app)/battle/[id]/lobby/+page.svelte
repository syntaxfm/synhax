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
		if (!battle.data) return;

		if (battle.data.status === 'ACTIVE') {
			goto(`/battle/${page.params.id}/code`);
			return;
		}

		if (
			battle.data.status === 'COMPLETED' &&
			battle.data.win_condition === 'FIRST_TO_PERFECT'
		) {
			goto(`/recap/${page.params.id}`);
		}
	});
</script>

<div class="card">
	{#if battle.data}
		{@const battleData = battle.data}
		<Header battle={battleData} target>
			{#snippet detail()}
				<h3>{remove_screaming(battleData.type ?? '')}</h3>
				<!-- <RefBanner battle={battle.data} /> -->
				<!-- <p>Today's Referee: {battle?.data?.referee?.name}</p> -->
				<ShareLinks battle={battleData} code={false} />
			{/snippet}
			{#snippet countdown()}
				<div>
					{#if battleData.type === 'TIMED_MATCH'}
						<Countdown battle={battleData} />
					{/if}
				</div>
			{/snippet}
		</Header>

		<Battlers battle={battleData} join={true} />

		{#if battleData.status === 'ACTIVE'}
			<p>Battle is currently active.</p>
			<a href={`/battle/${battleData.id}/code`}>Go to Battle</a>
		{/if}
	{/if}
</div>

<style>
	h3 {
		font-size: 30px;
		text-transform: capitalize;
	}
</style>
