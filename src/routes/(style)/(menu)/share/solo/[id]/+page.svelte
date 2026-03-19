<script lang="ts">
	import { queries, z } from '$lib/zero.svelte';
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import NewBattleButton from '$lib/battle_mode/NewBattleButton.svelte';

	let { data } = $props();

	const battle = $derived(
		z.createQuery(queries.battles.byIdSimple({ id: data.battleId }))
	);

	const target = $derived(
		z.createQuery(queries.targets.byId({ id: battle.data?.target_id ?? '' }))
	);

	const soloLeaderboard = $derived(
		z.createQuery(
			queries.battles.soloLeaderboardByTarget({
				targetId: target.data?.id ?? ''
			})
		)
	);

	const leaderboardRows = $derived.by(() => {
		const rows = soloLeaderboard.data
			.map((leaderboardBattle) => {
				const participants = leaderboardBattle.participants ?? [];
				const participant =
					participants.find(
						(candidate) => candidate.user_id === leaderboardBattle.referee_id
					) ?? participants[0];
				if (!participant) return null;

				const score = participant.hax?.diff_score ?? null;
				const completionMs = Math.max(
					1,
					Math.round((leaderboardBattle.total_time_seconds ?? 15 * 60) * 1000)
				);

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
				const aScore = a.score ?? -1;
				const bScore = b.score ?? -1;
				if (bScore !== aScore) return bScore - aScore;

				const aCompletion = a.completionMs ?? Number.POSITIVE_INFINITY;
				const bCompletion = b.completionMs ?? Number.POSITIVE_INFINITY;
				if (aCompletion !== bCompletion) return aCompletion - bCompletion;

				return a.createdAt - b.createdAt;
			})
			.map((row, index) => ({ ...row, rank: index + 1 }));

		return rows;
	});

	const thisBattleRow = $derived(
		leaderboardRows.find((row) => row.battleId === data.battleId) ?? null
	);

	const thisBattleParticipant = $derived.by(() => {
		const participants = battle.data?.participants ?? [];

		if (data.haxId) {
			const byHaxId = participants.find(
				(participant) => participant.hax?.id === data.haxId
			);
			if (byHaxId) return byHaxId;
		}

		const refereeId = battle.data?.referee_id;
		if (refereeId) {
			const byReferee = participants.find(
				(participant) => participant.user_id === refereeId
			);
			if (byReferee) return byReferee;
		}

		return participants[0] ?? null;
	});

	const displayPlayer = $derived(
		thisBattleRow?.userName ?? data.fallback.playerLabel
	);
	const displayTargetName = $derived(
		target.data?.name ?? battle.data?.target?.name ?? data.fallback.targetName
	);
	const displayTargetImage = $derived(
		target.data?.image ??
			battle.data?.target?.image ??
			data.fallback.targetImage
	);

	const frameHax = $derived.by(() => {
		const html = thisBattleParticipant?.hax?.html;
		const css = thisBattleParticipant?.hax?.css;

		if (typeof html !== 'string' || typeof css !== 'string') {
			return null;
		}

		return { html, css };
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
</script>

<main class="stack battle-surface share-layout" style="--gap: 1.5rem;">
	<section class="card stack" style="--gap: 1rem;">
		<div class="hero">
			<div class="stack" style="--gap: 0.75rem;">
				<h1>{displayPlayer}</h1>
				<p class="muted">
					Took on <strong>{displayTargetName}</strong> in a public solo challenge.
				</p>
				<div class="grid-two">
					<div class="stack" style="--gap: 0.35rem;">
						<h3>Result</h3>
						<div class="preview-frame">
							{#if frameHax}
								<AppFrame hax={frameHax} disableInspect={true} />
							{:else}
								<div class="empty-preview muted">Result image unavailable</div>
							{/if}
						</div>
					</div>

					<div class="stack" style="--gap: 0.35rem;">
						<h3>Target</h3>
						<div class="preview-frame">
							<img src={displayTargetImage} alt={displayTargetName} />
						</div>
					</div>
				</div>

				<div class="cluster stats" style="--gap: 0.75rem;">
					<div>
						<p class="label">Score</p>
						<p class="value">
							{thisBattleRow?.score}%
						</p>
					</div>
					<div>
						<p class="label">Time</p>
						<p class="value">
							{formatDuration(thisBattleRow?.completionMs)}
						</p>
					</div>
				</div>

				{#if target.data?.id}
					<div class="cta stack" style="--gap: 0.5rem;">
						<p class="muted">Want to try this target yourself?</p>
						<NewBattleButton target_id={target.data.id} />
					</div>
				{/if}
			</div>
		</div>
	</section>

	<section class="card stack" style="--gap: 0.75rem;">
		<h2>Public Solo Leaderboard</h2>
		<p class="muted">
			Ranked by score, then completion time, then earliest submit date.
		</p>

		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th>Rank</th>
						<th>User</th>
						<th>Score</th>
						<th>Time</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{#each leaderboardRows as row (row.battleId)}
						<tr class:current={row.battleId === data.battleId}>
							<td>#{row.rank}</td>
							<td>{row.userName}</td>
							<td>{row.score}%</td>
							<td>{formatDuration(row.completionMs)}</td>
							<td>{new Date(row.createdAt).toLocaleDateString()}</td>
						</tr>
					{:else}
						<tr>
							<td colspan="5" class="muted">No public solo attempts yet.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
</main>

<style>
	.share-layout {
		min-height: 100%;
		width: min(100%, 1100px);
		margin: 0 auto;
		padding: 1rem;
	}

	.card {
		padding: 1rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-m);
		background: var(--surface-1);
	}

	.hero {
		display: grid;
		gap: 1rem;
	}

	.grid-two {
		display: grid;
		gap: 5px;
		grid-template-columns: 1fr 1fr;
	}

	.preview-frame {
		aspect-ratio: 3 / 2;
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		overflow: hidden;
		max-width: 600px;
	}

	.preview-frame img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.preview-frame :global(.frame-container) {
		width: 100%;
		height: 100%;
	}

	.preview-frame :global(iframe) {
		width: 100%;
		height: 100%;
	}

	.empty-preview {
		height: 100%;
		display: grid;
		place-items: center;
		padding: 0.75rem;
		text-align: center;
		font-size: 0.85rem;
		background: var(--surface-0);
	}

	h1,
	h3,
	h2 {
		margin: 0;
	}

	h3 {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--fg-5);
	}

	p {
		margin: 0;
	}

	.stats > div {
		min-width: 120px;
		padding: 0.75rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		background: var(--surface-0);
	}

	.label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--fg-5);
	}

	.value {
		font-size: 1.15rem;
		font-weight: 700;
		margin-top: 0.2rem;
	}

	.cta :global(button) {
		min-width: 220px;
	}

	.table-wrap {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
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

	tbody tr.current {
		background: hsl(from var(--yellow) h s l / 0.12);
	}

	@media (max-width: 800px) {
		.grid-two {
			grid-template-columns: 1fr;
		}

		.preview-frame {
			max-width: 100%;
		}
	}
</style>
