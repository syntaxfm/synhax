<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
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
			.related('participants', (q) => q.related('user').related('hax', (h) => h.related('votes')))
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
	<Header battle={battle.current}>
		{#snippet detail()}
			<p>Today's Referee: {battle?.current?.referee?.name}</p>
			<ShareLinks battle={battle.current} />
		{/snippet}
		{#snippet countdown()}
			{#if battle.current?.type === 'TIMED_MATCH'}
				<Countdown battle={battle.current} />
			{/if}
		{/snippet}
	</Header>

	<div class="lobby-details">
		<h3>{remove_screaming(battle?.current?.type || '')}</h3>
		<Participants
			locked_in_participants={locked_in_participants || []}
			participants={battle.current?.participants || []}
		/>

		{#if !me}
			<p>The battle is about to start, please join the battle.</p>
			<button class="go_button" onclick={join_battle}>Join</button>
		{:else if me?.status === 'PENDING'}
			<button class="go_button" onclick={lock_in}>Lock In</button>
			<button class="go_button" onclick={leave_battle}>Leave</button>
		{/if}
	</div>

	<Battlers battle={battle.current} />

	{#if battle?.current?.status === 'ACTIVE'}
		<p>Battle is currently active.</p>
		<a href={`/battle/${battle.current.id}/code`}>Go to Battle</a>
	{/if}
{/if}

<style>
	.lobby-details {
		text-align: center;
		margin-block: 4rem;
		button {
			font-size: 40px;
			margin-block: 2rem;
		}
	}

	h3 {
		font-size: 40px;
		text-transform: capitalize;
	}
</style>
