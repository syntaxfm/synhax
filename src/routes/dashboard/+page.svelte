<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$sync/client';
	import LatestTargets from '$lib/targets/LatestTargets.svelte';
	import { files } from '$lib/state/FileState.svelte';
	import RequestAccess from '$lib/files/RequestAccess.svelte';
	import BattlesInProgress from '$lib/battle_mode/BattlesInProgress.svelte';

	const user = new Query(z.current.query.user.where('id', z.current.userID).one());

	files.check();
</script>

{#if user.current}
	{#if user.current.role === 'syntax'}
		<a href="/target/init">Create New Target</a>
	{/if}
{/if}

{#if files.status === 'ACCESS'}
	<p>Access to the directory is granted.</p>
	<RequestAccess text="Change Directory" />
{:else if files.status === 'NO_ACCESS'}
	<p>Checking access...</p>
{:else}
	<p>Access to the directory is denied.</p>
{/if}

<LatestTargets />
<BattlesInProgress />

<!-- TODO show new target button if role is syntax -->
<!-- ADD target IF role syntax -->
