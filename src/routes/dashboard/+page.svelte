<script lang="ts">
	import Logout from '$lib/user/Logout.svelte';
	import { Query } from 'zero-svelte';
	import { z } from '../../sync/client';
	import LatestTargets from '$lib/targets/LatestTargets.svelte';

	const user = new Query(z.current.query.user.where('id', z.current.userID).one());
</script>

<Logout />

{#if user.current}
	{#if user.current.role === 'syntax'}
		<a href="/target/init">Create New Target</a>
	{/if}
{/if}

<!-- {#if session?.sesh?.data}
	<div>
		<p>
			{session?.sesh?.data?.user.name}
		</p>
	</div>
{/if} -->
<LatestTargets />
<!-- TODO show new target button if role is syntax -->
<!-- ADD target IF role syntax -->
