<script lang="ts">
	import Logout from '$lib/user/Logout.svelte';
	import { z } from '$lib/zero.svelte';
	// - WHEN user is ID
	// - CAN Change Theme
	// - CAN Logout
	// - WHEN user is NOT ID
	// - CANNOT access
	const user = z.createQuery(z.query.user.where('id', z.userID).one());
</script>

<a href="/" class="button">Back</a>
<div class="stack">
	<h1>Settings</h1>
	<img src={user.data?.avatar} alt="{user.data?.name} Avatar" />
	<Logout />
</div>

<style>
	img {
		width: 300px;
	}
</style>
