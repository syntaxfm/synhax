<script lang="ts">
	import { BATTLE_AWARDS } from '$lib/constants';
	import { z, queries, mutators } from '$lib/zero.svelte';
	import type { Battle, Hax, Participants, User } from '$sync/schema';
	import { remove_screaming } from '$utils/formatting';

	const {
		battle,
		participant
	}: {
		battle: Battle;
		participant: Participants & { user: User; hax: Hax };
	} = $props();
	// TODO voting updating broken

	let votes = $derived.by(() =>
		z.createQuery(
			queries.battleVotes.myVotesForNominee({
				battleId: battle?.id || '',
				nomineeHaxId: participant?.hax?.id || ''
			})
		)
	);

	async function vote(award: (typeof BATTLE_AWARDS)[number], value: number) {
		const current_vote = votes.data?.find((v) => v.award_type === award);
		if (participant.hax.id) {
			try {
				await z.mutate(
					mutators.battle_votes.upsert({
						id: current_vote?.id || crypto.randomUUID(),
						battle_id: battle.id || '',
						nominee_hax_id: participant.hax.id,
						voter_id: z.userID,
						award_type: award,
						value
					})
				).server;
			} catch (error) {
				console.error('Error voting in battle:', error);
				alert('Failed to submit vote. Please try again.');
			}
		}
	}
</script>

<div class="voting">
	{#each BATTLE_AWARDS as award}
		<div class="vote">
			<label for="winner">{remove_screaming(award)}:</label>
			<wa-rating
				value={votes.data?.find((v) => v.award_type === award)?.value || 0}
				label="Rating"
				style="font-size: 1.6rem;"
				onchange={(e: Event & { target: { value: number } }) =>
					vote(award, e.target.value)}
			></wa-rating>
		</div>
	{/each}
</div>

<style>
	.voting {
		padding: 10px;
		background: linear-gradient(to top, rgb(0 0 0 / 1), rgb(0 0 0 / 0));
		display: grid;
		grid-template-columns: auto 1fr;
	}
	.vote {
		display: grid;
		width: 100%;
		grid-column: 1 / -1;
		grid-template-columns: subgrid;
		align-items: center;
		text-align: right;
	}
	label {
		font-size: 14px;
		text-transform: capitalize;
	}
</style>
