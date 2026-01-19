<script lang="ts">
	import Logout from '$lib/user/Logout.svelte';
	import { z, queries } from '$lib/zero.svelte';

	const user = z.createQuery(queries.user.current());
</script>

<div class="battle-surface">
	<h1>Settings</h1>
	<Logout />
</div>
