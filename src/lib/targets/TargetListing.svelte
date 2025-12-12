<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import TargetCard from './TargetCard.svelte';
	let { limit = 0 }: { limit: number } = $props();
	let targets = z.createQuery(z.query.targets.related('ratings').limit(limit));
</script>

<div class="scroll-wrapper">
	<div class="latest-scroll">
		{#each targets.data as target}
			<TargetCard {target} />
		{/each}
	</div>
</div>

<style>
	.scroll-wrapper {
		position: relative;
	}

	.latest-scroll {
		position: absolute;
		left: 0;
		width: 100vw;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 400px));
		overflow-x: scroll;
		overflow-y: hidden;
		gap: 30px;
		scrollbar-width: none;
		padding: 60px 20px 60px;
	}
</style>
