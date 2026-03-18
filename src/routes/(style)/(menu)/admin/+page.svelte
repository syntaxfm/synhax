<script lang="ts">
	import { queries, z } from '$lib/zero.svelte';

	const users = z.createQuery(queries.user.all());
	const targets = z.createQuery(queries.targets.all());
	const battles = z.createQuery(queries.battles.all());
	const hax = z.createQuery(queries.hax.all());

	const userCount = $derived(users.data?.length ?? 0);
	const soloBattleCount = $derived(
		(battles.data ?? []).filter((battle) => battle.type === 'SOLO').length
	);
	const teamBattleCount = $derived(
		(battles.data ?? []).filter((battle) => battle.type !== 'SOLO').length
	);
	const haxCount = $derived(hax.data?.length ?? 0);

	type ScoreBucketDef = {
		label: string;
		min: number;
		max: number;
	};

	const scoreBucketDefs: ScoreBucketDef[] = [
		{ label: '0-70', min: 0, max: 70 },
		{ label: '71-79', min: 71, max: 79 },
		{ label: '80-84', min: 80, max: 84 },
		{ label: '85-89', min: 85, max: 89 },
		{ label: '90-94', min: 90, max: 94 },
		...Array.from({ length: 6 }, (_, index) => {
			const min = 95 + index;
			const max = min;
			return {
				label: `${min}`,
				min,
				max
			};
		})
	];

	const targetStats = $derived.by(() => {
		const allTargets = targets.data ?? [];
		const allBattles = battles.data ?? [];
		const allHax = hax.data ?? [];

		const soloBattles = allBattles.filter((battle) => battle.type === 'SOLO');
		const soloBattleIds = soloBattles.reduce<Record<string, boolean>>(
			(acc, battle) => {
				acc[battle.id] = true;
				return acc;
			},
			{}
		);
		const soloHaxWithScore = allHax.filter(
			(entry) =>
				typeof entry.diff_score === 'number' &&
				!!entry.battle_id &&
				!!soloBattleIds[entry.battle_id]
		);

		const attemptsByTarget: Record<string, number> = {};
		for (const battle of soloBattles) {
			attemptsByTarget[battle.target_id] =
				(attemptsByTarget[battle.target_id] ?? 0) + 1;
		}

		const scoresByTarget: Record<string, number[]> = {};
		for (const entry of soloHaxWithScore) {
			const score = Math.max(0, Math.min(100, entry.diff_score ?? 0));
			const existing = scoresByTarget[entry.target_id] ?? [];
			existing.push(score);
			scoresByTarget[entry.target_id] = existing;
		}

		return allTargets
			.map((target) => {
				const attempts = attemptsByTarget[target.id] ?? 0;
				const scores = scoresByTarget[target.id] ?? [];

				const buckets = scoreBucketDefs.map((bucket) => ({
					label: bucket.label,
					count: scores.filter((score) => {
						const wholePercent = Math.floor(score);
						return wholePercent >= bucket.min && wholePercent <= bucket.max;
					}).length
				}));

				const maxBucketCount = buckets.reduce(
					(max, bucket) => Math.max(max, bucket.count),
					0
				);

				const averageScore =
					scores.length > 0
						? scores.reduce((sum, score) => sum + score, 0) / scores.length
						: null;

				return {
					id: target.id,
					name: target.name,
					image: target.image,
					attempts,
					scoredAttempts: scores.length,
					averageScore,
					buckets,
					maxBucketCount
				};
			})
			.filter((target) => target.attempts > 0 || target.scoredAttempts > 0)
			.sort((a, b) => b.attempts - a.attempts || a.name.localeCompare(b.name));
	});
</script>

<svelte:head>
	<title>Admin - Synhax</title>
</svelte:head>

<div class="stack" style:--gap="24px;">
	<h1 class="game-title">Admin</h1>

	<section class="stats-grid" aria-label="Admin platform statistics">
		<article class="stat-card battle-surface">
			<p class="stat-label">Users</p>
			<p class="stat-value">{userCount}</p>
		</article>

		<article class="stat-card battle-surface">
			<p class="stat-label">Solo Battles</p>
			<p class="stat-value">{soloBattleCount}</p>
		</article>

		<article class="stat-card battle-surface">
			<p class="stat-label">Team Battles</p>
			<p class="stat-value">{teamBattleCount}</p>
		</article>

		<article class="stat-card battle-surface">
			<p class="stat-label">Hacks Created</p>
			<p class="stat-value">{haxCount}</p>
		</article>
	</section>

	<section class="stack" style:--gap="16px;">
		<h2 class="section-title">Solo Target Stats</h2>

		{#if targetStats.length === 0}
			<p class="empty">No solo target stats yet.</p>
		{:else}
			<div class="target-stats-grid">
				{#each targetStats as target (target.id)}
					<article class="target-card battle-surface">
						<header class="target-header">
							<img src={target.image} alt={target.name} class="target-thumb" />
							<div class="target-meta">
								<h3 class="target-name">{target.name}</h3>
								<p class="target-copy">
									{target.attempts} attempts · {target.scoredAttempts} scored
								</p>
								<p class="target-copy">
									{#if target.averageScore !== null}
										Avg score {target.averageScore.toFixed(1)}%
									{:else}
										No score data yet
									{/if}
								</p>
							</div>
						</header>

						<div
							class="distribution-wrap"
							aria-label={`Score distribution for ${target.name}`}
						>
							<p class="axis-label">% completed</p>
							<div class="distribution-chart">
								{#each target.buckets as bucket (bucket.label)}
									<div class="band">
										<p class="band-count">{bucket.count}</p>
										<div class="band-track">
											<div
												class="band-fill"
												style={`height: ${target.maxBucketCount > 0 ? (bucket.count / target.maxBucketCount) * 100 : 0}%`}
											></div>
										</div>
										<p class="band-label">{bucket.label}</p>
									</div>
								{/each}
							</div>
						</div>
					</article>
				{/each}
			</div>
		{/if}
	</section>
</div>

<style>
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
		gap: var(--pad-m);
	}

	.stat-card {
		padding: var(--pad-l);
		display: flex;
		flex-direction: column;
		gap: var(--pad-xs);
		min-height: 120px;
		justify-content: center;
	}

	.stat-label {
		margin: 0;
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--fg-5);
	}

	.stat-value {
		margin: 0;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		line-height: 1;
		color: var(--fg);
	}

	.section-title {
		margin: 0;
		font-size: clamp(1.2rem, 2.5vw, 1.5rem);
		color: var(--fg);
	}

	.empty {
		margin: 0;
		padding: var(--pad-m);
		border: 1px dashed var(--border-subtle);
		border-radius: var(--br-s);
		color: var(--fg-5);
		background: var(--surface-0);
	}

	.target-stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: var(--pad-m);
	}

	.target-card {
		padding: var(--pad-m);
		display: flex;
		flex-direction: column;
		gap: var(--pad-m);
	}

	.target-header {
		display: flex;
		align-items: center;
		gap: var(--pad-m);
	}

	.target-thumb {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: var(--br-s);
		border: 1px solid var(--border-subtle);
	}

	.target-meta {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.target-name {
		margin: 0;
		font-size: 1rem;
	}

	.target-copy {
		margin: 0;
		font-size: 0.75rem;
		color: var(--fg-5);
	}

	.distribution-wrap {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: var(--pad-s);
		align-items: end;
	}

	.axis-label {
		margin: 0;
		font-size: 0.65rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--fg-5);
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(180deg);
	}

	.distribution-chart {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(18px, 1fr));
		gap: 6px;
		align-items: end;
	}

	.band {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.band-count {
		margin: 0;
		font-size: 0.6rem;
		line-height: 1;
		color: var(--fg-5);
		min-height: 0.7rem;
	}

	.band-track {
		height: 82px;
		width: 100%;
		min-width: 10px;
		display: flex;
		align-items: end;
		border-radius: var(--br-xs);
		overflow: hidden;
		background: var(--surface-0);
		border: 1px solid var(--border-subtle);
	}

	.band-fill {
		width: 100%;
		background: linear-gradient(180deg, var(--blue), var(--green));
		border-radius: 2px;
		min-height: 1px;
	}

	.band-label {
		margin: 0;
		height: 56px;
		font-size: 0.58rem;
		line-height: 1;
		color: var(--fg-5);
		writing-mode: vertical-rl;
		text-orientation: mixed;
		transform: rotate(180deg);
	}
</style>
