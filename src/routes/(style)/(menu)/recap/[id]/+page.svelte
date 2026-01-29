<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';
	import { BATTLE_RATINGS } from '$lib/constants';

	type WinnerParticipant = {
		id: string;
		user_id: string;
		display_order?: number | null;
		user?: { name?: string | null } | null;
		hax?: {
			id?: string | null;
			diff_score?: number | null;
			html?: string | null;
			css?: string | null;
		} | null;
	};

	function findWinner(
		participants: readonly WinnerParticipant[],
		winnerHaxId?: string | null
	) {
		if (winnerHaxId) {
			const winnerById = participants.find(
				(participant) => participant.hax?.id === winnerHaxId
			);
			if (winnerById) {
				return winnerById;
			}
		}

		let best: WinnerParticipant | null = null;
		let bestScore = -1;

		for (const participant of participants) {
			const score = participant.hax?.diff_score;
			if (score === undefined || score === null) {
				continue;
			}
			if (score > bestScore) {
				bestScore = score;
				best = participant;
			}
		}

		return best;
	}

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	let rating = $derived(
		z.createQuery(
			queries.ratings.myForTarget({ targetId: battle.data?.target?.id || '' })
		)
	);

	const isParticipant = $derived(
		battle.data?.participants?.some(
			(participant) => participant.user_id === z.userID
		) ?? false
	);
	const isReferee = $derived(
		battle.data?.referee?.id === z.userID ||
			battle.data?.referee_id === z.userID
	);
	const canView = $derived(
		Boolean(
			battle.data &&
			(battle.data.visibility === 'PUBLIC' || isParticipant || isReferee)
		)
	);

	const winner = $derived(
		findWinner(battle.data?.participants ?? [], battle.data?.winner_hax_id)
	);
	const viewerParticipant = $derived(
		battle.data?.participants?.find(
			(participant) => participant.user_id === z.userID
		) ?? null
	);
	const recapBattlers = $derived.by(() => {
		const participants = (battle.data?.participants ?? []).filter(
			(participant) => participant.hax && participant.user
		);

		if (participants.length <= 1) {
			return participants;
		}

		const ordered = [...participants]
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2);

		if (viewerParticipant) {
			const meIndex = ordered.findIndex(
				(participant) => participant.user_id === viewerParticipant.user_id
			);
			if (meIndex === -1) {
				return ordered;
			}
			const me = ordered[meIndex];
			const opponent = ordered.find((_, index) => index !== meIndex);
			return opponent ? [me, opponent] : [me];
		}

		return ordered;
	});
	function isWinnerParticipant(participant: WinnerParticipant) {
		return Boolean(winner && participant.id === winner.id);
	}

	function getOutcomeLabel(participant: WinnerParticipant) {
		if (!winner) {
			return 'No Winner';
		}

		return isWinnerParticipant(participant) ? 'You Win' : 'You Lose';
	}

	function rate_battle(
		rating_type: (typeof BATTLE_RATINGS)[number],
		rating_value: number
	) {
		let new_rating: Partial<Record<(typeof BATTLE_RATINGS)[number], number>> = {
			[rating_type]: rating_value
		};

		const mutation = z.mutate(
			mutators.ratings.upsert({
				id: rating.data?.id || crypto.randomUUID(),
				user_id: z.userID,
				target_id: battle.data?.target?.id || '',
				difficulty: rating.data?.difficulty || 0,
				creativity: rating.data?.creativity || 0,
				fun: rating.data?.fun || 0,
				coolness: rating.data?.coolness || 0,
				...new_rating
			})
		);

		mutation.server.catch((error: unknown) => {
			console.error('Error rating battle:', error);
			alert('Failed to submit rating. Please try again.');
		});
	}
</script>

<svelte:head>
	<title>{battle.data?.target?.name ?? 'Battle'} Recap - Synhax</title>
</svelte:head>

{#if battle.data && canView}
	{@const battleData = battle.data}
	<div class="stack battle-surface recap-layout" style="--gap: 2rem;">
		<header class="stack" style="--gap: 0.75rem;">
			<div class="stack" style="--gap: 0.35rem; text-align: center;">
				<h1 class="game-title">{battleData.target?.name ?? 'Battle'} Recap</h1>
				<div class="cluster recap-tags" style="justify-content: center;">
					<span class="tag muted" style="--tag-color: var(--slate);">
						{remove_screaming(battleData.win_condition ?? '')}
					</span>
					<span class="tag muted" style="--tag-color: var(--gray);">
						{remove_screaming(battleData.type ?? '')}
					</span>
				</div>
			</div>
		</header>

		<section class="stack" style="--gap: 1rem;">
			<BattleRecapGrid
				participants={recapBattlers.map((participant) => {
					const isWinner = isWinnerParticipant(participant);
					return {
						id: participant.id,
						user: participant.user,
						hax: participant.hax,
						outcomeLabel: getOutcomeLabel(participant),
						tone: isWinner ? 'win' : winner ? 'loss' : 'neutral'
					};
				})}
				target={battleData.target}
				showOutcomeLabel={true}
			/>
		</section>
	</div>
{:else if battle.data}
	<p>This battle is private. Sorry.</p>
{/if}

<style>
	h1,
	h2 {
		margin: 0;
	}

	.recap-tags {
		--gap: 0.5rem;
	}

	.recap-layout {
		min-height: 100%;
		max-width: 1920px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
	}

	.recap-layout > section {
		display: flex;
	}

	/*
	.ratings {
		display: grid;
		text-align: center;
		grid-template-columns: auto 1fr auto 1fr;
		grid-template-rows: auto 1fr;
		width: min(100%, 520px);
		gap: 5px;
		align-items: center;
		.rating {
			display: grid;
			grid-template-columns: subgrid;
			grid-column: 1 / 3;
			align-items: center;
			&:nth-child(even) {
				grid-column: 3/5;
			}
		}
	}*/
</style>
