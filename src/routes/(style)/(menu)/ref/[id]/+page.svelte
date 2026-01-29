<script lang="ts">
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import { mutators, queries, z } from '$lib/zero.svelte';
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

	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');

	const is_referee = $derived(
		battle.data?.referee_id === z.userID ||
			battle.data?.referee?.id === z.userID
	);

	const hasPerfect = $derived(
		battle.data?.winner_hax_id ||
			(battle.data?.participants ?? []).some(
				(participant) => (participant.hax?.diff_score ?? 0) >= 100
			)
	);

	async function add_overtime(minutes: number) {
		if (!battle.data || !is_referee) return;

		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				overtime_seconds: minutes * 60,
				ends_at: Date.now() + minutes * 60 * 1000
			})
		);
		over_status = 'ACTIVE';
	}

	function finish_battle() {
		if (!battle.data || !is_referee) return;

		let winner_hax_id: string | null = null;
		if (battle.data.win_condition === 'FIRST_TO_PERFECT') {
			let highest_score = -1;
			for (const participant of battle.data.participants ?? []) {
				const hax = participant.hax;
				if (!hax) continue;
				const score = hax.diff_score ?? 0;
				if (score > highest_score) {
					highest_score = score;
					winner_hax_id = hax.id;
				}
			}
			console.log(
				`[finish_battle] FIRST_TO_PERFECT winner: ${winner_hax_id} with score ${highest_score}`
			);
		}

		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				status: 'COMPLETED',
				winner_hax_id
			})
		);
	}
</script>

<svelte:head>
	<title>{battle.data?.target?.name ?? 'Battle'} - Referee - Synhax</title>
</svelte:head>

{#if battle.data}
	{@const battleData = battle.data}
	<div class="stack battle-surface ref-layout" style="--gap: 2rem;">
		<Header battle={battleData} target={false} diffScore={null} {battlers}>
			{#snippet detail()}{/snippet}
			{#snippet countdown()}
				{#if battleData.status === 'ACTIVE'}
					<Countdown
						battle={battleData}
						view="REF"
						bind:status={over_status}
						onautoend={finish_battle}
					/>
				{/if}
			{/snippet}
		</Header>
		<header class="stack" style="--gap: 0.75rem;">
			<div class="stack" style="--gap: 0.35rem; text-align: center;">
				<h1 class="game-title">{battleData.target?.name ?? 'Battle'}</h1>
				<div class="cluster recap-tags" style="justify-content: center;">
					<span class="tag muted" style="--tag-color: var(--slate);">
						{remove_screaming(battleData.type ?? '')}
					</span>
					<span class="tag muted" style="--tag-color: var(--gray);">
						{remove_screaming(battleData.status ?? '')}
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
				target={battleData.target}
				showOutcomeLabel={false}
			/>
		</section>
	</div>

	{#if battleData.type === 'TIMED_MATCH' && battleData.status === 'ACTIVE' && over_status === 'OVER' && is_referee && !hasPerfect}
		<Modal title="Time's Up!" open={true}>
			<div class="stack" style="align-items: center;">
				<button class="go_button big_button" onclick={finish_battle}>
					Finish Battle
				</button>

				<hr style="width: 100%;" />

				<div class="stack" style="align-items: center;">
					<p>Need more time?</p>
					<div class="cluster">
						<button onclick={() => add_overtime(5)}>+5 min</button>
						<button onclick={() => add_overtime(10)}>+10 min</button>
						<button onclick={() => add_overtime(15)}>+15 min</button>
					</div>
				</div>
			</div>
		</Modal>
	{/if}
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
		width: 100%;
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
