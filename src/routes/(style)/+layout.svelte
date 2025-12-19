<script lang="ts">
	import '../reset.css';
	import '@drop-in/graffiti';
	import './style.css';
	import favicon from '$lib/assets/favicon.svg';
	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
