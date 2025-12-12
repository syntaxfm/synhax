<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import type { Battle } from '$sync/schema';
	const { battle }: { battle: Battle } = $props();
</script>

{#if battle.referee_id === z.userID}
	<section>
		<p>
			You are the referee, head on over to the <a
				target="_blank"
				href={`/battle/${battle.id}/ref`}>referee dashboard</a
			> to get this party started.
		</p>
	</section>
{/if}

<style>
	section {
		border: 1px solid #eee;
		border-radius: 5px;
		padding: 1em;
		text-align: center;
		a {
			color: var(--white);
		}
	}
</style>
