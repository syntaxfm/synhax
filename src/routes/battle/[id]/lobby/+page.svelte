<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Participants from '$lib/battle_mode/Participants.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z } from '$sync/client';
	import { remove_screaming } from '$utils/formatting';
	import { Query } from 'zero-svelte';

	let battle = new Query(
		z.current.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);
	let me = $derived(battle.current?.participants.find((p) => p.user_id === z.current.userID));
	let locked_in_participants = $derived(
		battle.current?.participants.filter(
			(p) => p.user_id === z.current.userID && p.status === 'READY'
		)
	);

	function join_battle() {
		z.current.mutate.battle_participants.insert({
			id: crypto.randomUUID(),
			battle_id: battle.current?.id || '',
			user_id: z.current.userID,
			status: 'PENDING' as const,
			display_order: battle.current?.participants.length || 0
		});
	}

	function lock_in() {
		if (me) {
			z.current.mutate.battle_participants.upsert({
				id: me.id,
				battle_id: battle.current?.id || '',
				user_id: z.current.userID,
				status: 'READY' as const
			});
		}
	}

	$effect(() => {
		if (battle?.current?.status === 'ACTIVE') {
			goto(`/battle/${page.params.id}/code`);
		}
	});
</script>

<header>
	<h2>Battle Lobby</h2>
</header>
{#if battle.current}
	<h4>The Target</h4>
	<img src={battle.current.target.image} alt="Battle Image" width="300" />
	<p>Today's Referee: {battle?.current?.referee?.name}</p>
	<h3>{remove_screaming(battle?.current?.type || '')}</h3>

	{#if !me}
		<button onclick={join_battle}>Join</button>
	{:else if me?.status === 'PENDING'}
		<button onclick={lock_in}>Lock In</button>
	{/if}

	{#if battle.current?.type === 'TIMED_MATCH'}
		<Countdown battle={battle.current} />
	{/if}

	<ShareLinks battle={battle.current} />

	<Participants
		locked_in_participants={locked_in_participants || []}
		participants={battle.current?.participants || []}
	/>

	{#each battle.current?.participants as participant}
		<div>
			<img src={participant.user?.image} alt="" />
			<p>{participant.user.name} is {participant.status}</p>
		</div>
	{/each}

	{#if battle?.current?.status === 'ACTIVE'}
		<p>Battle is currently active.</p>
		<a href={`/battle/${battle.current.id}/code`}>Go to Battle</a>
	{/if}
{/if}
