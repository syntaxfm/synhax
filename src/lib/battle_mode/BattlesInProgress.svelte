<script lang="ts">
	import { z, queries } from '$lib/zero.svelte';

	let battle = z.createQuery(queries.battles.byStatus({ status: 'PENDING' }));
	let battles_started = z.createQuery(
		queries.battles.byStatus({ status: 'ACTIVE' })
	);
</script>

{#if battle.data.length > 0}
	<h3>Battles About To Start</h3>

	{#each battle.data as b}
		<article>
			<a href={`/battle/${b.id}/lobby`}>Join the Battle</a>
		</article>
	{/each}
{/if}

{#if battles_started.data.length > 0}
	<h3>Battles In Progress</h3>

	{#each battles_started.data as b}
		<article>
			<a href={`/battle/${b.id}/code`}>Rejoin the Battle</a>
		</article>
	{/each}
{/if}
