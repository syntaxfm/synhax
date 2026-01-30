<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import { z, queries, mutators } from '$lib/zero.svelte';
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

	const battlers = $derived.by(() => {
		const participants = battle.data?.participants ?? [];
		const sorted = [...participants]
			// .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2);

		return sorted.map((participant, index) => {
			const displayOrder = participant.display_order ?? index;
			const color = displayOrder === 0 ? 'var(--blue)' : 'var(--red)';
			return {
				id: participant.id,
				user_id: participant.user_id,
				display_order: participant.display_order ?? null,
				color,
				user: participant.user,
				hax: participant.hax
			};
		});
	});
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

		return isWinnerParticipant(participant) ? 'WINNER' : 'LOSER';
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
		<Header battle={battleData} target={false} diffScore={null} {battlers} currentUserId={z.userID}>
			{#snippet detail()}{/snippet}
			{#snippet countdown()}
				<Countdown battle={battleData} view="REF" />
			{/snippet}
		</Header>

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
	.recap-layout :global(.battler-progress) {
		--battler-avatar-size: 72px;
		--min-display-width: 100px;
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
