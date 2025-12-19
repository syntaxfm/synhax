<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import { compute_battle_scores } from '$utils/scores';

	let battle = $derived(
		z.createQuery(
			queries.battles.byRoomId({
				zeroRoomId: page?.params?.zero_room_id || ''
			})
		)
	);
	let scores = $derived(compute_battle_scores(battle.data?.participants || []));
</script>

{#if battle.data && battle.data.visibility === 'PUBLIC'}
	<Header battle={battle.data}>
		{#snippet detail()}
			<div class="res">
				<p>Battle Type:{remove_screaming(battle?.data?.type || '')}</p>
				<p>Today's Referee: {battle?.data?.referee?.name}</p>
				<ShareLinks
					code={false}
					battle={battle.data}
					watch={false}
					vote={true}
				/>
			</div>
		{/snippet}
		{#snippet countdown()}{/snippet}
	</Header>
	<Battlers battle={battle.data} votes={true} {scores} />
{/if}

<style>
	p {
		text-transform: capitalize;
		& + p {
			margin-bottom: 1rem;
		}
	}
	.res {
		position: relative;
	}
</style>
