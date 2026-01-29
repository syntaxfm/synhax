<script lang="ts">
	import { z, queries } from '$lib/zero.svelte';

	let battles_pending = z.createQuery(
		queries.battles.byStatus({ status: 'PENDING' })
	);
	let battles_ready = z.createQuery(
		queries.battles.byStatus({ status: 'READY' })
	);
	let battles_active = z.createQuery(
		queries.battles.byStatus({ status: 'ACTIVE' })
	);
</script>

{#if battles_pending.data.length > 0}
	<h3>Battles Forming</h3>

	{#each battles_pending.data as b}
		<article>
			<a href={`/lobby/${b.id}`}>Join the Lobby</a>
		</article>
	{/each}
{/if}

{#if battles_ready.data.length > 0}
	<h3>Battles Ready to Start</h3>

	{#each battles_ready.data as b}
		<article>
			<a href={`/battle/${b.id}/code`}>Get Ready</a>
		</article>
	{/each}
{/if}

{#if battles_active.data.length > 0}
	<h3>Battles In Progress</h3>

	{#each battles_active.data as b}
		<article>
			<a href={`/battle/${b.id}/code`}>Rejoin the Battle</a>
		</article>
	{/each}
{/if}
