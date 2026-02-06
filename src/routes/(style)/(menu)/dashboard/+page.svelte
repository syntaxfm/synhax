<script lang="ts">
	import LatestTargets from '$lib/targets/LatestTargets.svelte';
	import BattleCard from '$lib/targets/BattleCard.svelte';
	import { z, queries } from '$lib/zero.svelte';

	// Get user's battle history
	const myBattles = z.createQuery(queries.battleParticipants.myHistory());
	const mySoloChallenges = z.createQuery(queries.battles.mySoloChallenges());

	// Derive battles from participants, sorted by most recent first
	const battles = $derived.by(() => {
		return myBattles.data
			.filter((p) => p.battle !== null)
			.map((p) => p.battle!)
			.filter((battle) => battle.type !== 'SOLO')
			.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
	});

	const soloBattles = $derived.by(() => {
		type SoloRow = {
			id: string;
			name: string;
			status: string | null;
			score: number | null;
		};

		return [...mySoloChallenges.data]
			.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
			.map((battle): SoloRow => {
				const me =
					battle.participants?.find(
						(participant) => participant.user_id === z.userID
					) ?? battle.participants?.[0];
				return {
					id: battle.id,
					name: battle.name || battle.target?.name || 'Solo Challenge',
					status: battle.status ?? null,
					score: me?.hax?.diff_score ?? null
				};
			});
	});

	function soloLinkForStatus(id: string, status: string | null | undefined) {
		if (status === 'COMPLETED') return `/recap/${id}`;
		if (status === 'ACTIVE') return `/battle/${id}/code`;
		return `/lobby/${id}`;
	}
</script>

<svelte:head>
	<title>Dashboard - Synhax</title>
</svelte:head>

<div class="dashboard">
	{#if battles.length > 0}
		<section class="section battle-surface">
			<header class="section-header">
				<h2>My Battles</h2>
				<p>Continue your existing battles or view recaps.</p>
			</header>
			<div class="layout-card">
				{#each battles as battle (battle.id)}
					<BattleCard {battle} />
				{/each}
			</div>
		</section>
	{/if}

	<section class="section battle-surface">
		<header class="section-header">
			<h2>My Solo Challenges</h2>
			<p>Continue your active runs or review completed solo recaps.</p>
		</header>
		{#if soloBattles.length > 0}
			<div class="layout-card solo-list">
				{#each soloBattles as battle (battle.id)}
					<article class="solo-row">
						<div class="solo-main">
							<h3>{battle.name}</h3>
							<p>
								<span class="status">{battle.status}</span>
								{#if battle.score !== null}
									<span class="muted">- {Math.round(battle.score)}%</span>
								{/if}
							</p>
						</div>
						<a
							class="button"
							href={soloLinkForStatus(battle.id, battle.status)}
						>
							{battle.status === 'COMPLETED'
								? 'View Recap'
								: battle.status === 'ACTIVE'
									? 'Continue'
									: 'Open Lobby'}
						</a>
					</article>
				{/each}
			</div>
		{:else}
			<p class="muted">
				No solo challenges yet. Start one from any target card.
			</p>
		{/if}
	</section>

	<section class="section battle-surface">
		<header class="section-header">
			<h2>Latest Targets</h2>
			<p>Jump into a new battle or practice.</p>
		</header>
		<LatestTargets />
	</section>
</div>

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: var(--pad-xl);
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: var(--pad-l);
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: var(--pad-xs);
	}

	.section-header h2 {
		margin: 0;
	}

	.section-header p {
		font-size: 0.85rem;
		color: var(--fg-5);
		margin: 0;
	}

	.solo-list {
		display: grid;
		gap: var(--pad-m);
	}

	.solo-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: var(--pad-m);
		padding: var(--pad-m);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		background: var(--surface-1);
	}

	.solo-main h3,
	.solo-main p {
		margin: 0;
	}

	.solo-main p {
		color: var(--fg-5);
		font-size: 0.8rem;
	}

	.solo-row .status {
		color: var(--fg);
		font-weight: 600;
	}

	@media (max-width: 700px) {
		.solo-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.solo-row .button {
			width: 100%;
			text-align: center;
		}
	}
</style>
