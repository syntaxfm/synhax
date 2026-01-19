<script lang="ts">
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import Participants from '$lib/battle_mode/Participants.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import ToggleButton from '$lib/ui/ToggleButton.svelte';
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { fade } from 'svelte/transition';

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');
	let controls_visible = $derived(
		['PENDING', 'ACTIVE'].includes(battle.data?.status ?? '')
	);

	async function toggle_privacy() {
		if (!battle.data) return;
		const new_visibility =
			battle.data.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				visibility: new_visibility
			})
		);
	}

	async function add_overtime(ot: number) {
		if (!battle.data) return;

		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				overtime_seconds: ot * 60,
				ends_at: Date.now() + ot * 60 * 1000
			})
		);
	}

	function finish_battle() {
		if (!battle.data) return;

		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				status: 'COMPLETED'
			})
		);
	}
	let locked_in_participants = $derived(
		battle.data?.participants.filter(
			(p) => p.user_id === z.userID && p.status === 'READY'
		)
	);
</script>

{#if battle.data}
	{@const battleData = battle.data}
	<Header battle={battleData} target>
		{#snippet detail()}
			<ShareLinks
				battle={battleData}
				code={false}
				watch={controls_visible}
				vote={!controls_visible}
			/>
		{/snippet}
		{#snippet countdown()}
			<!-- {#if battle.data.status === 'ACTIVE'} -->
			<Countdown
				battle={battleData}
				bind:status={over_status}
				view="REF"
				onautoend={battleData.allow_time_extension === false
					? finish_battle
					: undefined}
			/>
			<!-- {/if} -->
		{/snippet}
	</Header>

	{#if battleData.status === 'PENDING'}
		<section class="settings" transition:fade>
			<h2>Battle Settings</h2>

			<ToggleButton
				toggle={battleData.visibility === 'PUBLIC'}
				ontoggle={toggle_privacy}
				on_text="Public"
				off_text="Private"
			/>

			{#if controls_visible}
				<Participants
					locked_in_participants={locked_in_participants || []}
					participants={battleData.participants}
				/>
			{/if}
		</section>
	{/if}
	<Battlers battle={battleData} results={true} />

	{#if battleData.type === 'TIMED_MATCH' && battleData.allow_time_extension !== false}
		<Modal
			title="Time's Up!"
			open={battleData.status === 'ACTIVE' && over_status === 'OVER'}
		>
			<button
				class="go_button big_button"
				disabled={battleData.status !== 'ACTIVE' && over_status !== 'OVER'}
				onclick={finish_battle}>Finish Battle</button
			>

			<hr />
			<div class="overtime">
				<p>Need more time?</p>
				<label for="overtime">Add Overtime (minutes)</label>
				<div class="ot-buttons">
					<button onclick={() => add_overtime(5)}>5</button>
					<button onclick={() => add_overtime(10)}>10</button>
					<button onclick={() => add_overtime(15)}>15</button>
					<button onclick={() => add_overtime(20)}>20</button>
				</div>
			</div>
		</Modal>
	{/if}
{/if}

<style>
	h2 {
		font-size: 40px;
		text-align: center;
	}

	.time-limit-settings {
		font-size: 40px;
		font-weight: 900;
		input {
			width: 100px;
			margin-right: 10px;
		}
	}

	.settings {
		display: flex;
		flex-direction: column;
		gap: 20px;
		justify-content: center;
		align-items: center;
		button {
			font-size: 20px;
		}
		margin-block: 4rem;
	}

	.go_button {
		margin-bottom: 2rem;
	}

	.overtime {
		display: flex;
		flex-direction: column;
		gap: 10px;
		> p {
			margin-top: 1rem;
		}
	}

	.ot-buttons {
		display: flex;
		gap: 10px;
		justify-content: center;
		button {
			padding: 6px 20px;
			transition: 0.2s ease all;
			&:hover,
			&:focus-visible {
				background: var(--yellow);
				color: var(--bg);
				border-color: var(--yellow);
			}
		}
	}
</style>
