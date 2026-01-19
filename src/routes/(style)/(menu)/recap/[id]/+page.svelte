<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import CodeFrame from '$lib/battle_mode/CodeFrame.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { parseTargetCode } from '$utils/code';
	import { remove_screaming } from '$utils/formatting';
	import { BATTLE_RATINGS } from '$lib/constants';
	import sentinel from '../../../(app)/battle/sentinel-dark.css?raw';

	type WinnerParticipant = {
		id: string;
		user_id: string;
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

	const showVotingResults = $derived(battle.data?.win_condition === 'VOTING');
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

		if (viewerParticipant) {
			const ordered = participants
				.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
				.slice(0, 2);
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

		if (winner) {
			const remaining = participants.filter(
				(participant) => participant.id !== winner.id
			);
			return [winner, ...remaining].slice(0, 2);
		}

		return participants.slice(0, 2);
	});
	const targetImage = $derived(battle.data?.target?.image ?? '');
	const isCodeTarget = $derived(battle.data?.target?.type === 'CODE');
	const targetCode = $derived(
		parseTargetCode(battle.data?.target?.inspo ?? '')
	);
	const targetFrameData = $derived({
		html: targetCode.html,
		css: targetCode.css
	});

	function isWinnerParticipant(participant: WinnerParticipant) {
		return Boolean(winner && participant.id === winner.id);
	}

	function getOutcomeLabel(participant: WinnerParticipant) {
		if (!winner) {
			return participant.user?.name ?? 'Battler';
		}

		if (
			viewerParticipant &&
			participant.user_id === viewerParticipant.user_id
		) {
			return isWinnerParticipant(participant) ? 'You Win' : 'You Lose';
		}

		const name = participant.user?.name ?? 'Battler';
		return isWinnerParticipant(participant) ? `${name} Wins` : `${name} Loses`;
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
	{@html `<style>${sentinel}</style>`}
</svelte:head>

{#if battle.data && canView}
	{@const battleData = battle.data}
	<div class="stack battle-surface recap-layout" style="--gap: 2rem;">
		<header class="stack" style="--gap: 0.75rem;">
			<div class="stack" style="--gap: 0.35rem; text-align: center;">
				<h1>{battleData.target?.name ?? 'Battle'} Recap</h1>
				<div class="cluster recap-tags" style="justify-content: center;">
					<span class="tag muted" style="--tag-color: var(--slate);">
						{remove_screaming(battleData.win_condition ?? '')}
					</span>
					<span class="tag muted" style="--tag-color: var(--gray);">
						{remove_screaming(battleData.type ?? '')}
					</span>
				</div>
			</div>
			<!-- <ShareLinks
					code={false}
					watch={false}
					vote={showVotingResults}
					battle={battleData}
				/> -->
		</header>

		<section class="stack" style="--gap: 1rem;">
			<div class="recap-grid battle-panel">
				{#each recapBattlers as participant}
					{@const isWinner = isWinnerParticipant(participant)}
					{@const isLoser = Boolean(winner) && !isWinner}
					<article
						class="stack battler-card"
						class:win={isWinner}
						class:loss={isLoser}
						class:neutral={!winner}
						style="--gap: 1.5rem;"
					>
						<div class="stack battler-hero" style="--gap: 0.5rem;">
							<span
								class="tag battle-outcome"
								class:win={isWinner}
								class:loss={Boolean(winner) && !isWinner}
								class:neutral={!winner}
							>
								{getOutcomeLabel(participant)}
							</span>
							<div class="battler-meta">
								<h3>{participant.user?.name ?? 'Battler'}</h3>
								{#if participant.hax?.diff_score !== null && participant.hax?.diff_score !== undefined}
									<span
										class="tag battle-score"
										class:win={isWinner}
										class:loss={Boolean(winner) && !isWinner}
										class:neutral={!winner}
									>
										{participant.hax.diff_score}% Match
									</span>
									<span
										class="tag battle-score"
										class:win={isWinner}
										class:loss={Boolean(winner) && !isWinner}
										class:neutral={!winner}
										style:--tag-color={participant.user_id ===
										viewerParticipant?.user_id
											? 'var(--blue)'
											: 'var(--red)'}
									>
										{participant.user_id === viewerParticipant?.user_id
											? 'You'
											: 'Opponent'}
									</span>
								{/if}
							</div>
						</div>
						<div class="battler-panels">
							<div class="stack" style="--gap: 0.5rem;">
								<span class="status-badge">Result</span>
								<div class="result-frame battle-frame battle-frame--bordered">
									<AppFrame
										hax={{
											html: participant.hax?.html ?? '',
											css: participant.hax?.css ?? ''
										}}
									/>
								</div>
							</div>
							<div class="code-panel">
								<CodeFrame
									html_text={participant.hax?.html ?? ''}
									css_text={participant.hax?.css ?? ''}
								/>
							</div>
						</div>
					</article>
				{/each}

				{#if battleData.target}
					<div class="stack target-card" style="--gap: 0.5rem;">
						<span class="status-badge">Target</span>
						<div class="target-frame battle-frame battle-frame--bordered">
							{#if isCodeTarget}
								<AppFrame hax={targetFrameData} />
							{:else}
								<img
									src={targetImage}
									alt={battleData.target?.name ?? 'Target'}
								/>
							{/if}
						</div>
					</div>
				{/if}
			</div>
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
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.recap-layout > section {
		display: flex;
	}

	.battler-hero {
		align-items: flex-start;
	}

	.battler-meta {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.battler-card {
		padding: 1.5rem;
		border-radius: var(--br-l);
		background: hsl(from var(--black) h s 4%);
		border: 1px solid rgb(255 255 255 / 0.06);
		box-shadow:
			0 18px 30px rgb(0 0 0 / 0.35),
			0 1px 0 rgb(255 255 255 / 0.05) inset;
	}

	.battler-card.win {
		background: linear-gradient(
			135deg,
			hsl(from var(--yellow) h 50% 10%),
			hsl(from var(--black) h s 3%)
		);
		border-color: rgb(250 191 71 / 0.35);
		box-shadow:
			0 18px 40px rgb(0 0 0 / 0.45),
			0 1px 0 rgb(255 255 255 / 0.08) inset;
	}

	.battler-card.loss {
		background: linear-gradient(
			135deg,
			hsl(from var(--slate) h s 6%),
			hsl(from var(--black) h s 3%)
		);
		border-color: rgb(148 163 184 / 0.2);
	}

	.battler-card.neutral {
		background: hsl(from var(--black) h s 4%);
	}

	.battler-card h3 {
		margin: 0;
		font-size: 1.35rem;
		letter-spacing: 0.01em;
	}

	.battle-outcome,
	.battle-score {
		--tag-color: var(--gray);
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.battle-outcome.win,
	.battle-score.win {
		--tag-color: var(--yellow);
	}

	.battle-outcome.loss,
	.battle-score.loss {
		--tag-color: var(--slate);
	}

	.battle-outcome.neutral,
	.battle-score.neutral {
		--tag-color: var(--gray);
	}

	.battle-score {
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.outcome-label {
		display: none;
	}

	@media (max-width: 1200px) {
		.recap-grid {
			grid-template-columns: 1fr;
		}
	}

	.recap-grid {
		display: grid;
		gap: var(--pad-l);
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: start;
	}

	.target-card {
		align-items: center;
	}

	.battler-panels {
		display: grid;
		gap: var(--pad-m);
		grid-template-columns: minmax(240px, 1fr);
		align-items: start;
	}

	.battler-card .status-badge {
		letter-spacing: 0.12em;
		font-weight: 700;
	}

	.result-frame,
	.target-frame {
		width: 400px;
		height: 300px;
		background: var(--black);
	}

	.result-frame img,
	.result-frame :global(iframe),
	.target-frame img,
	.target-frame :global(iframe) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.code-panel {
		border-radius: var(--br-s);
		overflow: hidden;
		border: 1px solid rgb(255 255 255 / 0.08);
		background: hsl(from var(--black) h s 4%);
		box-shadow: 0 12px 24px rgb(0 0 0 / 0.25);
	}

	.code-panel :global(pre) {
		margin: 0;
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
