<script lang="ts">
	import { queries, z } from '$lib/zero.svelte';

	const users = z.createQuery(queries.user.all());
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
</style>
