<script lang="ts">
	import LatestTargets from '$lib/targets/LatestTargets.svelte';
	import BattleCard from '$lib/targets/BattleCard.svelte';
	import { z, queries } from '$lib/zero.svelte';

	// Get user's battle history
	const myBattles = z.createQuery(queries.battleParticipants.myHistory());

	// Derive battles from participants, sorted by most recent first
	const battles = $derived.by(() => {
		return myBattles.data
			.filter((p) => p.battle !== null)
			.map((p) => p.battle!)
			.sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));
	});
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
</style>
