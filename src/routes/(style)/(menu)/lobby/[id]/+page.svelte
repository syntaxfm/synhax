<script lang="ts">
	import { page } from '$app/state';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import ToggleButton from '$lib/ui/ToggleButton.svelte';
	import { mutators, queries, z } from '$lib/zero.svelte';
	import Battlers from './Battlers.svelte';

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
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

	async function toggle_type() {
		if (!battle.data) return;
		const new_type =
			battle.data.type === 'TIME_TRIAL' ? 'TIMED_MATCH' : 'TIME_TRIAL';
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				type: new_type
			})
		);
	}

	function update_time_limit(event: Event) {
		if (!battle.data) return;
		const input = event.target as HTMLInputElement;
		const new_time = parseFloat(input.value);
		if (!isNaN(new_time)) {
			z.mutate(
				mutators.battles.update({
					id: battle.data.id,
					total_time_seconds: new_time * 60
				})
			);
		}
	}

	async function start() {
		if (!battle.data) return;

		const now = Date.now();
		const updates: any = {
			id: page.params.id,
			status: 'ACTIVE' as const,
			starts_at: now
		};

		// Set ends_at based on battle type
		if (battle.data.type === 'TIME_TRIAL') {
			updates.ends_at = null;
		} else if (battle.data.type === 'TIMED_MATCH') {
			updates.ends_at = now + battle.data.total_time_seconds * 1000;
		}

		z.mutate(mutators.battles.update(updates));
	}
</script>

{#if battle.data}
	<h1>{battle?.data?.target?.name} Battle</h1>
	<h2>Battle Settings</h2>

	<ToggleButton
		toggle={battle.data.visibility === 'PUBLIC'}
		ontoggle={toggle_privacy}
		on_text="Public"
		off_text="Private"
	/>

	<ToggleButton
		disabled={['ACTIVE', 'COMPLETED'].includes(battle.data?.status)}
		toggle={battle.data.type === 'TIME_TRIAL'}
		ontoggle={toggle_type}
		on_text="Time Trial"
		off_text="Timed Match"
	/>

	{#if battle.data?.type === 'TIMED_MATCH'}
		<div class="time-limit-settings">
			<label for="time-limit">Time Limit:</label>
			<input
				defaultValue={battle.data.total_time_seconds / 60 || 10}
				id="time-limit"
				type="number"
				placeholder="Enter time limit"
				required
				step="any"
				onchange={update_time_limit}
			/>minutes
		</div>
	{/if}

	<ShareLinks battle={battle.data} code={true} />

	<Battlers battle={battle.data} />

	{#if battle.data?.status === 'PENDING'}
		<button class="go_button" onclick={start}>Start Battle</button>
	{/if}
{/if}
