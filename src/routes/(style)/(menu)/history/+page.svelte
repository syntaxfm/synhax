<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { z } from '$lib/zero.svelte';
	import { user } from '$lib/auth-client';

	const history = z.createQuery(
		z.query.battle_participants
			.where('user_id', z.userID)
			.related('battle', (e) => e.related('target'))
	);
</script>

<h1>History</h1>

{#if history.data.length === 0}
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
			{#each history.data as participant}
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
