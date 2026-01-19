<script lang="ts">
	import { customAlphabet } from 'nanoid';
	import { files } from '$lib/state/FileState.svelte';
	import { goto } from '$app/navigation';
	import { z, mutators } from '$lib/zero.svelte';
	import RequestAccess from '$lib/files/RequestAccess.svelte';

	let { target_id } = $props();

	const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

	async function new_battle() {
		const id = crypto.randomUUID();
		const zero_room_id = nanoid();
		z.mutate(
			mutators.battles.insert({
				id,
				target_id,
				zero_room_id,
				type: 'TIME_TRIAL',
				total_time_seconds: 600, // Default 10 minutes
				overtime_seconds: 0,
				referee_id: z.userID
			})
		);
		goto(`/lobby/${id}`);
	}
</script>

{#if files.status === 'ACCESS'}
	<button onclick={new_battle}>Start Battle</button>
{:else}
	<RequestAccess />
{/if}
