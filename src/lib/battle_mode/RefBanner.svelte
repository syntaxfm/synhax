<script lang="ts">
	import { z } from '$sync/client';
	import type { Battle } from '$sync/schema';
	const { battle }: { battle: Battle } = $props();
</script>

{#if battle.referee_id === z.current.userID}
	<section>
		<p>
			You are the referee, head on over to the <a target="_blank" href={`/battle/${battle.id}/ref`}
				>referee dashboard</a
			> to get this party started.
		</p>
	</section>
{/if}

<!-- TODO timetrial not showing ready unless time limit changed -->

<style>
	section {
		border: 1px solid #eee;
		border-radius: 5px;
		padding: 1em;
		margin-bottom: 1em;
		text-align: center;
	}
</style>
