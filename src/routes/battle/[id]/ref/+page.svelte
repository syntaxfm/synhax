<script lang="ts">
	import { page } from '$app/state';
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import Battlers from '$lib/battle_mode/Battlers.svelte';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import ToggleButton from '$lib/ui/ToggleButton.svelte';
	import { z } from '$sync/client';
	import { Query } from 'zero-svelte';

	let battle = new Query(
		z.current.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user').related('hax', (h) => h.related('votes')))
			.related('target')
	);
	$inspect(battle.current);
	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');
	let controls_visible = $derived(['PENDING', 'ACTIVE'].includes(battle.current?.status));

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

		await z.current.mutate.battles.update(updates);
	}

	async function toggle_privacy() {
		if (!battle.current) return;
		const new_visibility = battle.current.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
		await z.current.mutate.battles.update({
			id: battle.current.id,
			visibility: new_visibility
		});
	}
	async function toggle_type() {
		if (!battle.current) return;
		const new_type = battle.current.type === 'TIME_TRIAL' ? 'TIMED_MATCH' : 'TIME_TRIAL';
		await z.current.mutate.battles.update({
			id: battle.current.id,
			type: new_type
		});
	}

	async function add_overtime(ot: number) {
		if (!battle.current) return;

		await z.current.mutate.battles.update({
			id: battle.current.id,
			overtime_seconds: ot * 60,
			ends_at: battle.current.ends_at + ot * 60 * 1000
		});
	}

	function update_time_limit(event: Event) {
		if (!battle.current) return;
		const input = event.target as HTMLInputElement;
		const new_time = parseFloat(input.value);
		if (!isNaN(new_time)) {
			z.current.mutate.battles.update({
				id: battle.current.id,
				total_time_seconds: new_time * 60
			});
		}
	}

	function finish_battle() {
		if (!battle.current) return;

		z.current.mutate.battles.update({
			id: battle.current.id,
			status: 'COMPLETED'
		});
	}
</script>

<header>
	<h2>Referee View</h2>
</header>

{#if battle.current}
	<h4>The Target</h4>
	<img src={battle.current.target.image} alt="Battle Image" width="300" />

	<p>Today's Referee: {battle?.current?.referee?.name}</p>

	<ToggleButton
		toggle={battle.current.visibility === 'PUBLIC'}
		ontoggle={toggle_privacy}
		on_text="Public"
		off_text="Private"
	/>

	<ShareLinks
		battle={battle.current}
		code={controls_visible}
		watch={controls_visible}
		vote={!controls_visible}
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
			<div>
				<label for="time-limit">Time Limit</label>
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

			<Countdown battle={battle.current} bind:status={over_status} view="REF" />

			{#if battle.current.status === 'ACTIVE' && over_status === 'OVER'}
				<h3>Time's Up!</h3>
				<button
					disabled={battle.current?.status !== 'ACTIVE' && over_status !== 'OVER'}
					onclick={finish_battle}>Finish Battle</button
				>

				<hr />
				<p>Need more time?</p>
				<label for="overtime">Add Overtime (minutes)</label>
				<button onclick={() => add_overtime(5)}>5</button>
				<button onclick={() => add_overtime(10)}>10</button>
				<button onclick={() => add_overtime(15)}>15</button>
				<button onclick={() => add_overtime(20)}>20</button>
			{/if}
		{/if}
	{/if}

	<Battlers battle={battle.current} results={true} />

	{#if battle.current?.status === 'PENDING'}
		<button
			disabled={battle.current.type === 'TIMED_MATCH' && battle.current?.total_time_seconds === 0}
			onclick={start}>Start</button
		>
	{/if}
{/if}

<!-- TODO add battlers from this screen -->

<!-- TODO add after completed, change interface to see votes, ability to reveal -->
