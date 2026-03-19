<script lang="ts">
	import '@awesome.me/webawesome/dist/components/rating/rating.js';
	import { page } from '$app/state';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { BATTLE_RATINGS } from '$lib/constants';
	import { copyToClipboard } from '$utils/clipboard';

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
	let soloLeaderboard = $derived(
		z.createQuery(
			queries.battles.soloLeaderboardByTarget({
				targetId: battle.data?.target?.id || ''
			})
		)
	);

	const isSoloBattle = $derived(battle.data?.type === 'SOLO');
	const origin = $derived(page.url.origin);
	const battleId = $derived(battle.data?.id ?? '');
	const socialShareUrl = $derived(
		battleId ? `${origin}/share/solo/${battleId}` : ''
	);
	const shareOnXUrl = $derived(
		socialShareUrl
			? `https://twitter.com/intent/tweet?url=${encodeURIComponent(socialShareUrl)}`
			: 'https://twitter.com/intent/tweet'
	);
	const socialShareText = $derived(
		socialShareUrl ? `Check out my solo battle recap: ${socialShareUrl}` : ''
	);
	const shareOnBlueskyUrl = $derived(
		socialShareText
			? `https://bsky.app/intent/compose?text=${encodeURIComponent(socialShareText)}`
			: 'https://bsky.app/intent/compose'
	);
	const canShowSoloShareControls = $derived(
		isSoloBattle &&
			battle.data?.visibility === 'PUBLIC' &&
			battle.data?.status === 'COMPLETED' &&
			(battle.data?.participants?.some(
				(participant) => participant.hax && participant.user
			) ??
				false)
	);

	let copiedShareLink = $state(false);
	let soloPreviewUploadStarted = $state(false);
	let soloPreviewUploadInFlight = $state(false);

	const isParticipant = $derived(
		battle.data?.participants?.some(
			(participant) => participant.user_id === z.userID
		) ?? false
	);

	const ownSoloParticipant = $derived.by(() => {
		if (!isSoloBattle) return null;
		return (
			battle.data?.participants?.find(
				(participant) => participant.user_id === z.userID && participant.hax?.id
			) ?? null
		);
	});
	const ownSoloHaxId = $derived(ownSoloParticipant?.hax?.id ?? '');
	const ownsSoloHax = $derived(Boolean(isSoloBattle && ownSoloParticipant));

	const battlers = $derived.by(() => {
		const participants = battle.data?.participants ?? [];
		const ordered = [...participants]
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2);

		return ordered.map((participant, index) => {
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
	const recapBattlers = $derived.by(() => {
		return (battle.data?.participants ?? [])
			.filter((participant) => participant.hax && participant.user)
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2);
	});
	function isWinnerParticipant(participant: WinnerParticipant) {
		return Boolean(winner && participant.id === winner.id);
	}

	function getOutcomeLabel(participant: WinnerParticipant) {
		if (isSoloBattle) {
			return 'Completed';
		}
		if (!winner) {
			return 'No Winner';
		}

		return isWinnerParticipant(participant) ? 'Winner' : 'Loser';
	}

	const soloLeaderboardRows = $derived.by(() => {
		if (!isSoloBattle) return [];

		const rows = soloLeaderboard.data
			.map((leaderboardBattle) => {
				const participants = leaderboardBattle.participants ?? [];
				const participant =
					participants.find(
						(candidate) => candidate.user_id === leaderboardBattle.referee_id
					) ?? participants[0];
				if (!participant) return null;
				const score = participant.hax?.diff_score ?? 0;
				const completionMs =
					leaderboardBattle.starts_at !== null &&
					leaderboardBattle.starts_at !== undefined &&
					leaderboardBattle.ends_at !== null &&
					leaderboardBattle.ends_at !== undefined
						? Math.max(
								0,
								leaderboardBattle.ends_at - leaderboardBattle.starts_at
							)
						: leaderboardBattle.total_time_seconds !== null &&
							  leaderboardBattle.total_time_seconds !== undefined
							? leaderboardBattle.total_time_seconds * 1000
							: null;
				return {
					battleId: leaderboardBattle.id,
					userId: participant.user_id,
					userName: participant.user?.name ?? 'Unknown user',
					score,
					completionMs,
					createdAt: leaderboardBattle.created_at ?? 0
				};
			})
			.filter((row): row is NonNullable<typeof row> => row !== null)
			.sort((a, b) => {
				if (b.score !== a.score) return b.score - a.score;
				const aCompletion = a.completionMs ?? Number.POSITIVE_INFINITY;
				const bCompletion = b.completionMs ?? Number.POSITIVE_INFINITY;
				if (aCompletion !== bCompletion) return aCompletion - bCompletion;
				return a.createdAt - b.createdAt;
			})
			.map((row, index) => ({ ...row, rank: index + 1 }));

		return rows;
	});

	function formatDuration(ms: number | null) {
		if (ms === null) return 'n/a';
		const totalSeconds = Math.floor(ms / 1000);
		const minutes = Math.floor(totalSeconds / 60)
			.toString()
			.padStart(2, '0');
		const seconds = (totalSeconds % 60).toString().padStart(2, '0');
		return `${minutes}:${seconds}`;
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

	async function copyUrl(url: string) {
		try {
			await copyToClipboard(url);
			copiedShareLink = true;
			setTimeout(() => {
				if (copiedShareLink) {
					copiedShareLink = false;
				}
			}, 1200);
		} catch (error) {
			console.error('Failed to copy URL:', error);
		}
	}

	async function uploadSoloPreview(pngDataUrl: string) {
		if (
			!isSoloBattle ||
			!ownsSoloHax ||
			!ownSoloHaxId ||
			soloPreviewUploadStarted ||
			soloPreviewUploadInFlight
		) {
			return;
		}

		soloPreviewUploadStarted = true;
		soloPreviewUploadInFlight = true;

		try {
			const imageBlob = await fetch(pngDataUrl).then((response) =>
				response.blob()
			);
			const file = new File([imageBlob], `solo-preview-${ownSoloHaxId}.png`, {
				type: 'image/png'
			});
			const formData = new FormData();
			formData.append('file', file);
			formData.append('hax_id', ownSoloHaxId);

			const uploadRes = await fetch('/api/uploads/solo-preview/upload', {
				method: 'POST',
				body: formData
			});

			if (!uploadRes.ok) {
				const error = await uploadRes
					.json()
					.catch(() => ({ error: 'Failed to upload preview image' }));
				throw new Error(error.error ?? 'Failed to upload preview image');
			}

			const payload = (await uploadRes.json()) as {
				success?: boolean;
			};
			if (!payload.success) {
				throw new Error('Upload response missing success state');
			}

			const mutation = z.mutate(
				mutators.hax.update({
					id: ownSoloHaxId,
					user_id: z.userID,
					updated_at: Date.now()
				})
			);
			await mutation.server;
		} catch (error) {
			console.error('Failed to upload solo preview image:', error);
			soloPreviewUploadStarted = false;
		} finally {
			soloPreviewUploadInFlight = false;
		}
	}
</script>

<svelte:head>
	<title>{battle.data?.target?.name ?? 'Battle'} Recap - Synhax</title>
</svelte:head>

{#if battle.data && canView}
	{@const battleData = battle.data}
	<div class="stack battle-surface recap-layout" style="--gap: 2rem;">
		<Header
			battle={battleData}
			target={false}
			diffScore={null}
			{battlers}
			currentUserId={z.userID}
		>
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
						tone: isSoloBattle
							? 'neutral'
							: isWinner
								? 'win'
								: winner
									? 'loss'
									: 'neutral'
					};
				})}
				target={battleData.target}
				showOutcomeLabel={!isSoloBattle}
				onResultPreviewReady={uploadSoloPreview}
			>
				{#if isSoloBattle && (canShowSoloShareControls || battleData.visibility !== 'PUBLIC')}
					<section class="stack leaderboard" style="--gap: 0.75rem;">
						<p>Share your result</p>
						{#if canShowSoloShareControls}
							<div class="cluster" style="--gap: 0.5rem; flex-wrap: wrap;">
								<button
									type="button"
									class="button"
									onclick={() => copyUrl(socialShareUrl)}
								>
									Copy share link
								</button>
								<a
									class="button"
									href={shareOnXUrl}
									target="_blank"
									rel="noreferrer noopener"
								>
									Share on X
								</a>
								<a
									class="button"
									href={shareOnBlueskyUrl}
									target="_blank"
									rel="noreferrer noopener"
								>
									Share on Bluesky
								</a>
							</div>
							{#if copiedShareLink}
								<p class="muted solo-copy">Share link copied.</p>
							{/if}
						{:else if battleData.visibility !== 'PUBLIC'}
							<p class="muted solo-copy">
								Solo sharing is disabled until this battle is public.
							</p>
						{/if}
					</section>
				{/if}
			</BattleRecapGrid>
		</section>

		{#if isSoloBattle}
			<section class="stack leaderboard" style="--gap: 0.75rem;">
				<h2>Public Solo Leaderboard</h2>
				<p class="muted">
					This leaderboard includes public completed solo battles for this
					target.
				</p>
				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th>Rank</th>
								<th>User</th>
								<th>Score</th>
								<th>Time</th>
								<th>Tie-break</th>
							</tr>
						</thead>
						<tbody>
							{#each soloLeaderboardRows as row (row.battleId)}
								<tr class:me={row.userId === z.userID}>
									<td>#{row.rank}</td>
									<td>{row.userName}</td>
									<td>{Math.round(row.score)}%</td>
									<td>{formatDuration(row.completionMs)}</td>
									<td>{new Date(row.createdAt).toLocaleDateString()}</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" class="muted">No public solo attempts yet.</td
									>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</section>
		{/if}
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

	.solo-copy {
		margin: 0;
		color: var(--fg-4);
	}

	.leaderboard h2 {
		margin: 0;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		overflow: hidden;
	}

	th,
	td {
		padding: 0.65rem 0.75rem;
		text-align: left;
		font-size: 0.85rem;
		border-bottom: 1px solid var(--border-subtle);
	}

	th {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--fg-5);
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	tbody tr.me {
		background: hsl(from var(--yellow) h s l / 0.12);
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
