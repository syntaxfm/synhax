<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$sync/client';
	import TargetCard from './TargetCard.svelte';
	let { limit = 0 }: { limit: number } = $props();
	let targets = new Query(z.current.query.targets.related('ratings').limit(limit));
</script>

<div class="latest-scroll">
	{#each targets.current as target}
		<TargetCard {target} />
	{/each}
</div>

<style>
	.latest-scroll {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 400px));
		overflow-x: scroll;
		gap: 30px;
		scrollbar-width: none;
		overflow-y: hidden;
		padding: 60px 20px;
	}
</style>
