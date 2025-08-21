<script lang="ts">
	import { BATTLE_AWARDS } from '$lib/constants';
	import { z } from '$sync/client';
	import type { Battle, Hax, Participants, User } from '$sync/schema';
	import { Query } from 'zero-svelte';

	const {
		battle,
		participant
	}: {
		battle: Battle;
		participant: Participants & { user: User; hax: Hax };
	} = $props();
	// TODO voting updating broken

	let votes = $derived.by(
		() =>
			new Query(
				z.current.query.battle_votes.where(({ and, cmp }) =>
					and(
						cmp('battle_id', battle?.id || ''),
						cmp('voter_id', z.current.userID),
						cmp('nominee_hax_id', participant?.hax?.id || '')
					)
				)
			)
	);

	function vote(award: (typeof BATTLE_AWARDS)[number], value: number) {
		const current_vote = votes.current?.find((v) => v.award_type === award);
		if (participant.hax.id) {
			z.current.mutate.battle_votes
				.upsert({
					id: current_vote?.id || crypto.randomUUID(),
					battle_id: battle.id || '',
					nominee_hax_id: participant.hax.id,
					voter_id: z.current.userID,
					award_type: award,
					value
				})
				.catch((error) => {
					console.error('Error voting in battle:', error);
					alert('Failed to submit vote. Please try again.');
				});
		}
	}
</script>

{#each BATTLE_AWARDS as award}
	<label for="winner">{award}:</label>
	<wa-rating
		value={votes.current?.find((v) => v.award_type === award)?.value || 0}
		label="Rating"
		style="font-size: 2rem;"
		onchange={(e) => vote(award, e.target.value)}
	></wa-rating>
{/each}
