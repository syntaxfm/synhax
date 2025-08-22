<script lang="ts">
	import Copybutton from '$lib/ui/Copybutton.svelte';
	import type { Battle } from '$sync/schema';
	const {
		battle,
		code = true,
		watch = true,
		vote = false
	}: {
		battle: Battle;
		code?: boolean;
		watch?: boolean;
		vote?: boolean;
	} = $props();
</script>

<div class="links">
	{#if code}
		<Copybutton
			label="Code"
			disabled={battle.status !== 'PENDING'}
			link={`http://localhost:5173/battle/${battle.id}/lobby`}
		/>
	{/if}

	{#if watch}
		<Copybutton
			label="Watch"
			disabled={battle.visibility !== 'PUBLIC' || battle.status === 'COMPLETED'}
			link={`http://localhost:5173/battle/${battle.zero_room_id}/watch`}
		/>
	{/if}

	{#if vote}
		<Copybutton
			label="Vote"
			disabled={battle.visibility !== 'PUBLIC' || battle.status !== 'COMPLETED'}
			link="http://localhost:5173/battle/{battle.zero_room_id}/watch/vote"
		/>
	{/if}
</div>
