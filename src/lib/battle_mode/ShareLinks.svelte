<script lang="ts">
	import Copybutton from '$lib/ui/Copybutton.svelte';
	import type { Battle } from '$sync/schema';
	import { page } from '$app/stores';
	const baseUrl = $derived($page.url.origin);
	const {
		battle,
		lobby = true,
		battleCode = false,
		watch = true,
		ref = false,
		alwaysEnabled = false
	}: {
		battle: Battle;
		lobby?: boolean;
		battleCode?: boolean;
		watch?: boolean;
		ref?: boolean;
		alwaysEnabled?: boolean;
	} = $props();
</script>

<div class="stack">
	{#if lobby}
		<Copybutton
			label="Lobby"
			disabled={!alwaysEnabled && battle.status !== 'PENDING'}
			link={`${baseUrl}/lobby/${battle.id}`}
		/>
	{/if}

	{#if battleCode}
		<Copybutton
			label="Battle View"
			disabled={!alwaysEnabled && battle.status === 'COMPLETED'}
			link={`${baseUrl}/battle/${battle.id}/code`}
		/>
	{/if}

	{#if watch}
		<Copybutton
			label="Watch"
			disabled={!alwaysEnabled &&
				(battle.visibility !== 'PUBLIC' || battle.status === 'COMPLETED')}
			link={`${baseUrl}/battle/${battle.zero_room_id}/watch`}
		/>
	{/if}

	{#if ref}
		<Copybutton
			label="Referee View"
			disabled={!alwaysEnabled && battle.status === 'COMPLETED'}
			link={`${baseUrl}/ref/${battle.id}`}
		/>
	{/if}
</div>
