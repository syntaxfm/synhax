<script lang="ts">
	import { z, queries } from '$lib/zero.svelte';

	const history = z.createQuery(queries.battleParticipants.myHistory());
</script>

<svelte:head>
	<title>Battle History - Synhax</title>
</svelte:head>

<div class="battle-surface">
	<h1 class="game-title">History</h1>

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
					{#if participant.battle}
						<tr>
							<td
								><img src={participant.battle.target?.image} alt="Target" /></td
							>
							<td
								><a href={`/recap/${participant.battle.id}`}
									>{participant.battle.created_at
										? new Date(participant.battle.created_at).toLocaleString()
										: 'Unknown'}</a
								></td
							>
						</tr>
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	img {
		width: 150px;
	}
</style>
