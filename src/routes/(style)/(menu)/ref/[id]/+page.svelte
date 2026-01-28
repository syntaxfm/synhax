<script lang="ts">
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import { queries, z } from '$lib/zero.svelte';
	import { remove_screaming } from '$utils/formatting';

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	const battlers = $derived.by(() => {
		const participants = battle.data?.participants ?? [];
		const sorted = [...participants]
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
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
		<Header battle={battle.data} target={false} diffScore={null} {battlers}>
			{#snippet detail()}{/snippet}
			{#snippet countdown()}
				{#if battle.data.status === 'ACTIVE'}
					<Countdown battle={battle.data} view="REF" />
				{/if}
			{/snippet}
		</Header>
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
	h1 {
		margin: 0;
	}

	.recap-tags {
		--gap: 0.5rem;
	}

	.ref-layout {
		min-height: 100%;
		max-width: 1920px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.ref-layout > section {
		display: flex;
	}

	.ref-layout :global(.battler-progress .avatar-wrapper) {
		width: 72px;
		height: 72px;
	}

	.ref-layout :global(.battler-progress .avatar) {
		--size: 72px;
	}

	.muted {
		color: var(--fg-muted);
	}
</style>
