<script lang="ts">
	import { customAlphabet } from 'nanoid';
	import { files } from '$lib/state/FileState.svelte';
	import { goto } from '$app/navigation';
	import { get_z } from '$lib/z';
	import RequestAccess from '$lib/files/RequestAccess.svelte';

	const z = get_z();

	let { target_id } = $props();

	const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

	async function new_battle() {
		const id = crypto.randomUUID();
		const zero_room_id = nanoid();
		await z.mutate.battles.insert({
			id,
			target_id,
			zero_room_id,
			type: 'TIME_TRIAL',
			total_time_seconds: 0,
			overtime_seconds: 0,
			referee_id: z.userID
		});
		goto(`/battle/${id}/ref`);
	}
</script>

{#if files.status === 'ACCESS'}
	<button class="go_button" onclick={new_battle}>New Battle</button>
{:else}
	<RequestAccess />
{/if}
