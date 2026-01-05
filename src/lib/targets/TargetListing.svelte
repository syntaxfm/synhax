<script lang="ts">
	import { z, queries } from '$lib/zero.svelte';
	import TargetCard from './TargetCard.svelte';
	let { limit = 0 }: { limit: number } = $props();
	// Use $derived so query updates if limit prop changes
	let targets = $derived(
		z.createQuery(queries.targets.withRatings({ limit: limit || undefined }))
	);
</script>

<div class="layout-card">
	{#each targets.data as target}
		<TargetCard {target} />
	{/each}
</div>
