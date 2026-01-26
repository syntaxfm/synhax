<script lang="ts">
	import Copybutton from '$lib/ui/Copybutton.svelte';
	import type { Battle } from '$sync/schema';
	import { PUBLIC_APP_URL } from '$env/static/public';
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
			link={`${PUBLIC_APP_URL}/lobby/${battle.id}`}
		/>
	{/if}

	{#if battleCode}
		<Copybutton
			label="Battle View"
			disabled={!alwaysEnabled && battle.status === 'COMPLETED'}
			link={`${PUBLIC_APP_URL}/battle/${battle.id}/code`}
		/>
	{/if}

	{#if watch}
		<Copybutton
			label="Watch"
			disabled={!alwaysEnabled &&
				(battle.visibility !== 'PUBLIC' || battle.status === 'COMPLETED')}
			link={`${PUBLIC_APP_URL}/battle/${battle.zero_room_id}/watch`}
		/>
	{/if}

	{#if ref}
		<Copybutton
			label="Referee View"
			disabled={!alwaysEnabled && battle.status === 'COMPLETED'}
			link={`${PUBLIC_APP_URL}/ref/${battle.id}`}
		/>
	{/if}
</div>
