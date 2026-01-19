<script lang="ts">
	import Copybutton from '$lib/ui/Copybutton.svelte';
	import type { Battle } from '$sync/schema';
	import { PUBLIC_APP_URL } from '$env/static/public';
	const {
		battle,
		code = true,
		watch = true,
		ref = false,
		alwaysEnabled = false
	}: {
		battle: Battle;
		code?: boolean;
		watch?: boolean;
		ref?: boolean;
		alwaysEnabled?: boolean;
	} = $props();
</script>

<div class="stack">
	{#if code}
		<Copybutton
			label="Code"
			disabled={!alwaysEnabled && battle.status !== 'PENDING'}
			link={`${PUBLIC_APP_URL}/battle/${battle.id}/lobby`}
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
			label="Ref"
			disabled={!alwaysEnabled && battle.status === 'COMPLETED'}
			link={`${PUBLIC_APP_URL}/ref/${battle.id}`}
		/>
	{/if}
</div>
