<script lang="ts">
	import { customAlphabet } from 'nanoid';
	const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);
	import { goto } from '$app/navigation';
	import { z } from '$sync/client';

	let { target_id } = $props();

	async function new_battle() {
		const id = crypto.randomUUID();
		const zero_room_id = nanoid();
		await z.current.mutate.battles.insert({
			id,
			target_id,
			zero_room_id,
			type: 'TIME_TRIAL',
			total_time_seconds: 0,
			overtime_seconds: 0,
			referee_id: z.current.userID
		});
		goto(`/battle/${id}/init`);
	}
</script>

<button onclick={new_battle}>New Battle</button>
