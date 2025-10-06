<script lang="ts">
	import { page } from '$app/state';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import Header from '$lib/battle_mode/Header.svelte';
	import Participants from '$lib/battle_mode/Participants.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import ToggleButton from '$lib/ui/ToggleButton.svelte';
	import { get_z } from '$lib/z';
	import { fade } from 'svelte/transition';
	import { Query } from 'zero-svelte';

	const z = get_z();

	let battle = new Query(
		z.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) =>
				q.related('user').related('hax', (h) => h.related('votes'))
			)
			.related('target')
	);

	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');
	let controls_visible = $derived(
		['PENDING', 'ACTIVE'].includes(battle.current?.status)
	);

	async function start() {
		if (!battle.current) return;

		const now = Date.now();
		const updates: any = {
			id: page.params.id,
			status: 'ACTIVE' as const,
			starts_at: now
		};

		// Set ends_at based on battle type
		if (battle.current.type === 'TIME_TRIAL') {
			updates.ends_at = null;
		} else if (battle.current.type === 'TIMED_MATCH') {
			updates.ends_at = now + battle.current.total_time_seconds * 1000;
		}

		await z.mutate.battles.update(updates);
	}

	async function toggle_privacy() {
		if (!battle.current) return;
		const new_visibility =
			battle.current.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
		await z.mutate.battles.update({
			id: battle.current.id,
			visibility: new_visibility
		});
	}

	async function toggle_type() {
		if (!battle.current) return;
		const new_type =
			battle.current.type === 'TIME_TRIAL' ? 'TIMED_MATCH' : 'TIME_TRIAL';
		await z.mutate.battles.update({
			id: battle.current.id,
			type: new_type
		});
	}

	async function add_overtime(ot: number) {
		if (!battle.current) return;

		await z.mutate.battles.update({
			id: battle.current.id,
			overtime_seconds: ot * 60,
			ends_at: Date.now() + ot * 60 * 1000
		});
	}

	function update_time_limit(event: Event) {
		if (!battle.current) return;
		const input = event.target as HTMLInputElement;
		const new_time = parseFloat(input.value);
		if (!isNaN(new_time)) {
			z.mutate.battles.update({
				id: battle.current.id,
				total_time_seconds: new_time * 60
			});
		}
	}

	function finish_battle() {
		if (!battle.current) return;

		z.mutate.battles.update({
			id: battle.current.id,
			status: 'COMPLETED'
		});
	}
	let locked_in_participants = $derived(
		battle.current?.participants.filter(
			(p) => p.user_id === z.userID && p.status === 'READY'
		)
	);
</script>

{#if battle.current}
	<Header battle={battle.current}>
		{#snippet detail()}
			<ShareLinks
				battle={battle.current}
				code={false}
				watch={controls_visible}
				vote={!controls_visible}
			/>
		{/snippet}
		{#snippet countdown()}
			<!-- {#if battle.current.status === 'ACTIVE'} -->
			<Countdown battle={battle.current} bind:status={over_status} view="REF" />
			<!-- {/if} -->
		{/snippet}
	</Header>

	{#if battle.current.status === 'PENDING'}
		<section class="settings" transition:fade>
			<h2>Battle Settings</h2>

			<ToggleButton
				toggle={battle.current.visibility === 'PUBLIC'}
				ontoggle={toggle_privacy}
				on_text="Public"
				off_text="Private"
			/>

			{#if controls_visible}
				<ToggleButton
					disabled={['ACTIVE', 'COMPLETED'].includes(battle.current?.status)}
					toggle={battle.current.type === 'TIME_TRIAL'}
					ontoggle={toggle_type}
					on_text="Time Trial"
					off_text="Timed Match"
				/>

				{#if battle.current?.type === 'TIMED_MATCH'}
					<div class="time-limit-settings">
						<label for="time-limit">Time Limit:</label>
						<input
							defaultValue={battle.current.total_time_seconds / 60 || 10}
							id="time-limit"
							type="number"
							placeholder="Enter time limit"
							required
							step="any"
							onchange={update_time_limit}
						/>minutes
					</div>
				{/if}
				<Participants
					locked_in_participants={locked_in_participants || []}
					participants={battle.current?.participants || []}
				/>
				{#if battle.current?.status === 'PENDING'}
					<button class="go_button" onclick={start}>Start Battle</button>
				{/if}
			{/if}
		</section>
	{/if}
	<Battlers battle={battle.current} results={true} />

	{#if battle.current?.type === 'TIMED_MATCH'}
		<Modal
			title="Time's Up!"
			open={battle.current.status === 'ACTIVE' && over_status === 'OVER'}
		>
			<button
				class="go_button big_button"
				disabled={battle.current?.status !== 'ACTIVE' && over_status !== 'OVER'}
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

<!-- TODO SMall private toggle -->

<!-- TODO time trial not showing ready unless time limit changed -->

<!-- TODO add after completed, change interface to see votes, ability to reveal -->

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
				color: var(--black);
				border-color: var(--yellow);
			}
		}
	}
</style>
