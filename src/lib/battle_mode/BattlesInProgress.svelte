<script lang="ts">
	import { z } from '$sync/client';
	import { Query } from 'zero-svelte';

	let battle = new Query(z.current.query.battles.where('status', 'PENDING').related('target'));
	let battles_started = new Query(
		z.current.query.battles.where('status', 'ACTIVE').related('target')
	);
</script>

{#if battle.current.length > 0}
	<h3>Battles About To Start</h3>

	{#each battle.current as b}
		<article>
			<a href={`/battle/${b.id}/lobby`}>Join the Battle</a>
		</article>
	{/each}
{/if}

{#if battles_started.current.length > 0}
	<h3>Battles In Progress</h3>

	{#each battles_started.current as b}
		<article>
			<a href={`/battle/${b.id}/code`}>Rejoin the Battle</a>
		</article>
	{/each}
{/if}
