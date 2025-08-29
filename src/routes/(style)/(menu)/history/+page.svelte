<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$sync/client';

	const history = new Query(
		z.current.query.battle_participants
			.where('user_id', z.current.userID)
			.related('battle', (e) => e.related('target'))
	);
</script>

<h1>History</h1>

{#if history.current.length === 0}
	<p>No battles found.</p>
{:else}
	<table>
		<thead>
			<tr>
				<th>Target</th>
				<th>Date</th>
			</tr>
		</thead>
		<tbody>
			{#each history.current as participant}
				<tr>
					<td><img src={participant.battle.target?.image} /></td>
					<td
						><a href={`/battle/${participant.battle.id}/recap`}
							>{new Date(participant.battle.created_at).toLocaleString()}</a
						></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	img {
		width: 150px;
	}
</style>
