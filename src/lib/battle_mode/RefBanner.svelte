<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import type { Battle } from '$sync/schema';
	const { battle }: { battle: Battle } = $props();
</script>

{#if battle.referee_id === z.userID}
	<section>
		<p>
			You're hosting this battle. Open the <a
				target="_blank"
				href={`/battle/${battle.id}/ref`}>host dashboard</a
			> to manage the match.
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
			color: var(--fg);
		}
	}
</style>
