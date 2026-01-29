<script lang="ts">
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import { queries, z } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	const recapBattlers = $derived.by(() =>
		(battle.data?.participants ?? []).filter(
			(participant) => participant.hax && participant.user
		)
	);
</script>

<svelte:head>
	<title>{battle.data?.target?.name ?? 'Battle'} - Referee - Synhax</title>
</svelte:head>

{#if battle.data}
	<div class="stack battle-surface ref-layout" style="--gap: 2rem;">
		<header class="stack" style="--gap: 0.75rem;">
			<div class="stack" style="--gap: 0.35rem; text-align: center;">
				<h1 class="game-title">{battle.data.target?.name ?? 'Battle'}</h1>
				<div class="cluster recap-tags" style="justify-content: center;">
					<span class="tag muted" style="--tag-color: var(--slate);">
						{remove_screaming(battle.data.type ?? '')}
					</span>
					<span class="tag muted" style="--tag-color: var(--gray);">
						{remove_screaming(battle.data.status ?? '')}
					</span>
				</div>
			</div>

			{#if battle.data.status === 'ACTIVE'}
				<div class="cluster" style="justify-content: center;">
					<Countdown battle={battle.data} view="REF" />
				</div>
			{/if}
		</header>

		<section class="stack" style="--gap: 1rem;">
			<BattleRecapGrid
				participants={recapBattlers.map((participant) => ({
					id: participant.id,
					user: participant.user,
					hax: participant.hax,
					outcomeLabel: 'Battler',
					tone: 'neutral'
				}))}
				target={battle.data.target}
				showOutcomeLabel={false}
			/>
		</section>
	</div>
{:else}
	<p>Loading battle...</p>
{/if}

<style>
	h1,
	h2,
	h3 {
		margin: 0;
	}

	.target-thumbnail {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: var(--br-m);
		border: none;
		box-shadow: none;
	}

	.recap-tags {
		--gap: 0.5rem;
	}

	.ref-layout {
		min-height: 100%;
		max-width: 1920px;
		width: 100%;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.ref-layout > section {
		display: flex;
	}

	.muted {
		color: var(--fg-muted);
	}
</style>
