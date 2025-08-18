<script lang="ts">
	import type { UserState } from './state/UserState.svelte';

	const { user }: { user: UserState } = $props();
</script>

<iframe bind:this={user.app_frame} title="App Frame"></iframe>
