<script lang="ts">
	import LatestTargets from '$lib/targets/LatestTargets.svelte';
	import { files } from '$lib/state/FileState.svelte';
	// import BattlesInProgress from '$lib/battle_mode/BattlesInProgress.svelte'
	import { z, queries } from '$lib/zero.svelte';

	const user = z.createQuery(queries.user.current());

	let battle_select = $state(false);
	files.check();

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			battle_select = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- {#if files.status === 'ACCESS'}
	<BattlesInProgress />
	{/if} -->

<div class:battle_select>
	<button
		onclick={() => {
			battle_select = true;
		}}>Battle</button
	>
	{#if user.data}
		{#if user.data.role === 'syntax'}
			<a href="/admin/targets/init">New Target</a>
		{/if}
	{/if}
	<a href="/history">Past Battles</a>
	<a href="/settings">Settings</a>
</div>

<LatestTargets {battle_select} />

<style>
	svg {
		mask-image: url(/Grit%20Mask@2x.wqK0L7zb.png);
		mask-repeat: repeat;
		mask-size: 400px;
		padding: 10px;
	}
	.logo {
		mask-size: 300px;
		mask-image: url(/Grit%20Mask@2x.wqK0L7zb.png);
		background: #92dd00;
	}
</style>
