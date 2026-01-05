<script lang="ts">
	import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
	import { files } from '$lib/state/FileState.svelte';
	import { to_snake_case } from '$lib/user/utils';
	import { mutators, z } from '$lib/zero.svelte';
	import type {
		Battle,
		Hax,
		Participants,
		Target,
		User,
		Votes
	} from '$sync/schema';

	const {
		battle
	}: {
		battle: Battle & {
			target: Target;
			participants: readonly (Participants & {
				user: User;
				hax: Hax & { votes: readonly Votes[] };
			})[];
		};
	} = $props();

	let me_participant = $derived(
		battle?.participants.find((p: Participants) => p.user_id === z.userID)
	);

	function join_battle() {
		// Make sure target actually exists
		if (battle?.target?.name) {
			// Create hax with files
			z.mutate(
				mutators.hax.insert({
					id: crypto.randomUUID(),
					user_id: z.userID,
					target_id: battle?.target_id || '',
					battle_id: battle?.id || '',
					html: HTML_TEMPLATE,
					css: CSS_TEMPLATE,
					type: 'BATTLE'
				})
			);

			// First create file structure for battle
			files.create_hax_directory(to_snake_case(battle.target.name));

			// Add self as a participant
			z.mutate(
				mutators.battle_participants.insert({
					id: crypto.randomUUID(),
					battle_id: battle?.id || '',
					user_id: z.userID,
					status: 'PENDING' as const,
					display_order: battle?.participants.length || 0
				})
			);
		}
	}

	function leave_battle() {
		if (me_participant && battle?.id) {
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
					battle_id: battle?.id || '',
					user_id: z.userID,
					status: 'READY' as const
				})
			);
		}
	}

	$inspect(me_participant);
</script>

<button onclick={join_battle}>Join</button>

{#each battle.participants as battler}
	<img src={battler.user.image} alt="" />
{/each}
