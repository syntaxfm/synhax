<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$sync/client';
	import TargetCard from './TargetCard.svelte';
	let { limit = 0 }: { limit: number } = $props();
	let targets = new Query(z.current.query.targets.limit(limit));
</script>

{#each targets.current as target}
	<TargetCard {target} />
{/each}
