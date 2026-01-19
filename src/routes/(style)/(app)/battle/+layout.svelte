<script lang="ts">
	import { files } from '$lib/state/FileState.svelte';

	import sentinel from './sentinel-dark.css?raw';

	const { children } = $props();
	files.check();
</script>

<svelte:head>
	{@html `<style>${sentinel}</style>`}
</svelte:head>

<div>
	{@render children()}
</div>
