<script lang="ts">
	import type { UserState } from '$lib/state/UserState.svelte';

	const { user }: { user: UserState } = $props();
</script>

<section>
	<span class="status {user.status}">
		Status: {user.status}
	</span>
	<span>Dir: {user.synhax_directory_handle?.name}</span>
	<span class="error">{user.error}</span>
</section>

<style>
	section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		font-size: 0.7rem;
		border-top: var(--border);
	}

	.status {
		color: blue;
	}

	.ERROR {
		color: red;
		overflow: scroll;
	}
</style>
