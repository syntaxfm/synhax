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

{#if battles.length > 0}
	<section class="stack battle-surface" style="--gap: 1.5rem;">
		<header class="stack" style="--gap: 0.5rem; text-align: center;">
			<h1>My Battles</h1>
			<p class="muted">Continue your existing battles or view recaps.</p>
		</header>
		<div class="layout-card">
			{#each battles as battle (battle.id)}
				<BattleCard {battle} />
			{/each}
		</div>
	</section>
{/if}

<section class="stack battle-surface" style="--gap: 1.5rem;">
	<header class="stack" style="--gap: 0.5rem; text-align: center;">
		<h1>Latest Targets</h1>
		<p class="muted">Jump into a new battle or practice.</p>
	</header>
	<LatestTargets />
</section>
