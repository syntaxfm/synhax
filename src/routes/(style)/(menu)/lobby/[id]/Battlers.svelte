<script lang="ts">
	import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
	import { files } from '$lib/state/FileState.svelte';
	import { mutators, z } from '$lib/zero.svelte';
	import PlayerCard from './PlayerCard.svelte';

	type ParticipantStatus =
		| 'PENDING'
		| 'ACTIVE'
		| 'READY'
		| 'DROPPED'
		| 'FINISHED'
		| null;

	type Battler = {
		id: string;
		user_id: string;
		status: ParticipantStatus;
		user?: {
			name: string;
			username?: string | null;
			image?: string | null;
			avatar?: string | null;
		};
		hax?: {
			id: string;
		} | null;
	};

	type BattleWithParticipants = {
		id: string;
		target_id: string | null;
		target?: {
			name?: string | null;
		} | null;
		participants: readonly Battler[];
	};

	const {
		battle
	}: {
		battle: BattleWithParticipants;
	} = $props();

	let me_participant = $derived(
		battle.participants.find((participant) => participant.user_id === z.userID)
	);

	function join_battle() {
		// Make sure target actually exists
		if (battle.target?.name) {
			const activeParticipants = battle.participants.filter(
				(participant) => participant.status !== 'DROPPED'
			);
			if (activeParticipants.length >= 2) {
				alert('This battle already has two battlers.');
				return;
			}
			// Create hax with files
			z.mutate(
				mutators.hax.insert({
					id: crypto.randomUUID(),
					user_id: z.userID,
					target_id: battle.target_id || '',
					battle_id: battle.id,
					html: HTML_TEMPLATE,
					css: CSS_TEMPLATE,
					type: 'BATTLE'
				})
			);

			// First create file structure for battle (use battle ID for unique folders)
			files.create_hax_directory(battle.id);

			// Add self as a participant
			z.mutate(
				mutators.battle_participants.insert({
					id: crypto.randomUUID(),
					battle_id: battle.id,
					user_id: z.userID,
					status: 'PENDING' as const,
					display_order: activeParticipants.length
				})
			);
		}
	}

	function leave_battle() {
		if (me_participant) {
			z.mutate(
				mutators.battle_participants.delete({
					id: me_participant.id
				})
			);
		}
	}

	function lock_in() {
		if (me_participant) {
			z.mutate(
				mutators.battle_participants.upsert({
					id: me_participant.id,
					battle_id: battle.id,
					user_id: z.userID,
					status: 'READY' as const
				})
			);
		}
	}
</script>

<section class="stack">
	<h2>Battlers</h2>

	{#if !me_participant}
		<button class="battle-button" onclick={join_battle}>Join Battle</button>
	{/if}

	<div class="layout-card" style="--min-card-width: 180px;">
		{#each battle.participants
			.filter((participant) => participant.status !== 'DROPPED')
			.slice(0, 2) as battler}
			<PlayerCard {battler} onlockin={lock_in} onleave={leave_battle} />
		{/each}
	</div>
</section>
