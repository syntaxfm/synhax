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
	{@const battleData = battle.data}
	{#if battleData.visibility === 'PUBLIC'}
		<Header battle={battleData} target>
			{#snippet detail()}
				<p>Today's Referee: {battleData.referee?.name}</p>
				<h3>{remove_screaming(battleData.type ?? '')}</h3>
				<ShareLinks code={false} battle={battleData} />
			{/snippet}
			{#snippet countdown()}
				{#if battleData.type === 'TIMED_MATCH'}
					<Countdown battle={battleData} view="WATCH" />
				{/if}
			{/snippet}
		</Header>

		<Battlers battle={battleData} results={true} />
	{:else}
		<div class="private">
			<p>This battle is private. Sorry.</p>
		</div>
	{/if}
{/if}

<style>
	.private {
		text-align: center;
		margin-block: 4rem;
	}
</style>
