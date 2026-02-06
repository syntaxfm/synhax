<script lang="ts">
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import BattleRecapGrid from '$lib/battle_mode/BattleRecapGrid.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import { mutators, queries, z } from '$lib/zero.svelte';

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

	const recapBattlers = $derived.by(() =>
		(battle.data?.participants ?? [])
			.filter((participant) => participant.hax && participant.user)
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2)
	);

	const winner = $derived(
		findWinner(battle.data?.participants ?? [], battle.data?.winner_hax_id)
	);

	function isWinnerParticipant(participant: WinnerParticipant) {
		return Boolean(winner && participant.id === winner.id);
	}

	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');
	let custom_overtime_minutes = $state(5);

	const custom_overtime_valid = $derived.by(
		() =>
			Number.isInteger(custom_overtime_minutes) && custom_overtime_minutes >= 1
	);

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

	function start_custom_overtime() {
		if (!custom_overtime_valid) return;
		add_overtime(custom_overtime_minutes);
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
		<Header
			battle={battleData}
			target={false}
			diffScore={null}
			{battlers}
			currentUserId={z.userID}
		>
			{#snippet detail()}{/snippet}
			{#snippet countdown()}
				<Countdown
					battle={battleData}
					view="REF"
					bind:status={over_status}
					onautoend={finish_battle}
				/>
			{/snippet}
		</Header>

		<section class="stack" style="--gap: 1rem;">
			<BattleRecapGrid
				participants={recapBattlers.map((participant) => {
					const isWinner = isWinnerParticipant(participant);
					const outcomeLabel = winner
						? isWinner
							? 'Winner'
							: 'Loser'
						: 'No Winner';
					const tone = winner ? (isWinner ? 'win' : 'loss') : 'neutral';
					return {
						id: participant.id,
						user: participant.user,
						hax: participant.hax,
						outcomeLabel,
						tone
					};
				})}
				target={battleData.target}
				showOutcomeLabel={battleData.status === 'COMPLETED'}
				showDiff={false}
			/>
		</section>
	</div>

	{#if battleData.paused_at}
		<div class="paused-overlay">
			<div class="layout-card stack paused-card" style="--gap: 0.75rem;">
				<h2>Battle Paused</h2>
				<p>The host has paused the battle.</p>
			</div>
		</div>
	{/if}

	{#if battleData.type === 'TIMED_MATCH' && battleData.status === 'ACTIVE' && over_status === 'OVER' && is_referee && !hasPerfect}
		<Modal title="Time's Up!" open={true}>
			<div class="stack" style="align-items: center;">
				<button class="go_button big_button" onclick={finish_battle}>
					Finish Battle
				</button>

				<hr style="width: 100%;" />

				<div class="stack" style="align-items: center;">
					<p>Need more time?</p>
					<div class="cluster" style="--gap: 0.5rem;">
						<button onclick={() => add_overtime(5)}>+5 min</button>
						<button onclick={() => add_overtime(10)}>+10 min</button>
						<button onclick={() => add_overtime(15)}>+15 min</button>
					</div>
					<form
						class="cluster"
						style="--gap: 0.5rem;"
						onsubmit={(event) => {
							event.preventDefault();
							start_custom_overtime();
						}}
					>
						<input
							type="number"
							min="1"
							step="1"
							inputmode="numeric"
							aria-label="Custom overtime minutes"
							bind:value={custom_overtime_minutes}
						/>
						<button type="submit" disabled={!custom_overtime_valid}>
							+ Custom
						</button>
					</form>
				</div>
			</div>
		</Modal>
	{/if}
{:else}
	<p>Loading battle...</p>
{/if}

<style>
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

	.ref-layout :global(.battler-progress) {
		--battler-avatar-size: 72px;
		--min-display-width: 100px;
	}

	.paused-overlay {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 0.65);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	.paused-card {
		width: min(90vw, 480px);
		text-align: center;
	}
</style>
