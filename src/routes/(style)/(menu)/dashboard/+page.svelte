<script lang="ts">
	import LatestTargets from '$lib/targets/LatestTargets.svelte';
	import { files } from '$lib/state/FileState.svelte';
	import { z, queries } from '$lib/zero.svelte';
</script>

<svelte:head>
	<title>Dashboard - Synhax</title>
</svelte:head>

<section class="stack battle-surface" style="--gap: 1.5rem;">
	<header class="stack" style="--gap: 0.5rem; text-align: center;">
		<h1>Latest Targets</h1>
		<p class="muted">Jump into a new battle or practice.</p>
	</header>
	<LatestTargets />
</section>
