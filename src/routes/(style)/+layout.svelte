<script lang="ts">
	import '../reset.css';
	import './style.css';
	import favicon from '$lib/assets/favicon.svg';
	import { z } from '$sync/client';
	import { Query } from 'zero-svelte';
	import Jukebox from '$lib/media/Jukebox.svelte';

	let { children } = $props();

	const battles = new Query(z.current.query.battles);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<!-- <Jukebox /> -->
