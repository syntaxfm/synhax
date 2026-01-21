<script lang="ts">
	import Bread from '$lib/ui/Bread.svelte';

	const { children } = $props();
</script>

<div class="admin-content stack battle-surface">
	<Bread />
	{@render children()}
</div>

<style>
	.admin-content {
		padding: var(--pad-l);
		overflow-y: auto;
	}
</style>
