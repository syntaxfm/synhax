<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Participants from '$lib/battle_mode/Participants.svelte';
	import RefBanner from '$lib/battle_mode/RefBanner.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
	import { files } from '$lib/state/FileState.svelte';
	import { to_snake_case } from '$lib/user/utils';
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
		// Make sure target actually exists
		if (battle?.current?.target?.name) {
			// Create hax with files
			z.current.mutate.hax.insert({
				id: crypto.randomUUID(),
				user_id: z.current.userID,
				target_id: battle.current?.target_id || '',
				battle_id: battle.current?.id || '',
				html: HTML_TEMPLATE,
				css: CSS_TEMPLATE,
				type: 'BATTLE'
			});

			// First create file structure for battle
			files.create_hax_directory(to_snake_case(battle.current.target.name));

			// Add self as a participant
			z.current.mutate.battle_participants.insert({
				id: crypto.randomUUID(),
				battle_id: battle.current?.id || '',
				user_id: z.current.userID,
				status: 'PENDING' as const,
				display_order: battle.current?.participants.length || 0
			});
		}
	}

	function leave_battle() {
		if (me && battle?.current?.id) {
			z.current.mutate.battle_participants.delete({
				id: me.id
			});
		}
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

{#if battle.current}
	<RefBanner battle={battle.current} />
	<h4>The Target</h4>

	<header>
		<h2>Battle Lobby</h2>
	</header>

	<img src={battle.current.target.image} alt="Battle Image" width="300" />
	<p>Today's Referee: {battle?.current?.referee?.name}</p>
	<h3>{remove_screaming(battle?.current?.type || '')}</h3>
	<Participants
		locked_in_participants={locked_in_participants || []}
		participants={battle.current?.participants || []}
	/>

	{#if !me}
		<p>The battle is about to start, please join the battle.</p>
		<button onclick={join_battle}>Join</button>
	{:else if me?.status === 'PENDING'}
		<button onclick={lock_in}>Lock In</button>
		<button onclick={leave_battle}>Leave</button>
	{/if}

	{#if battle.current?.type === 'TIMED_MATCH'}
		<Countdown battle={battle.current} />
	{/if}

	<ShareLinks battle={battle.current} />

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
