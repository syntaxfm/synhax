<script lang="ts">
	import { files } from '$lib/state/FileState.svelte';
	import horizonDark from 'svelte-highlight/styles/horizon-dark';

	const { children } = $props();
	files.check();
</script>

<svelte:head>
	{@html horizonDark}
</svelte:head>

{@render children()}
