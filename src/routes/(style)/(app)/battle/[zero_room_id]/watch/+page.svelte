<script lang="ts">
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';

	let battle = $derived(
		z.createQuery(
			queries.battles.byRoomId({
				zeroRoomId: page?.params?.zero_room_id || ''
			})
		)
	);
</script>

{#if battle.data}
	{#if battle.data.visibility === 'PUBLIC'}
		<Header battle={battle.data}>
			{#snippet detail()}
				<p>Today's Referee: {battle?.data?.referee?.name}</p>
				<h3>{remove_screaming(battle?.data?.type || '')}</h3>
				<ShareLinks code={false} battle={battle.data} />
			{/snippet}
			{#snippet countdown()}
				{#if battle.data?.type === 'TIMED_MATCH'}
					<Countdown battle={battle.data} view="WATCH" />
				{/if}
			{/snippet}
		</Header>

		<Battlers battle={battle.data} results={true} />
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
