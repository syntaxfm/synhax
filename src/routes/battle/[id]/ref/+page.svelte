<script lang="ts">
	import { page } from '$app/state';
	import { z } from '$sync/client';
	import { Query } from 'zero-svelte';

	let battle = new Query(
		z.current.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);

	async function start() {
		await z.current.mutate.battles.update({
			id: page.params.id,
			status: 'ACTIVE' as const
		});
	}
</script>

<header>
	<h2>Referee View</h2>
</header>

{#if battle.current}
	<h4>The Target</h4>
	<img src={battle.current.target.image} alt="Battle Image" width="300" />

	<p>Today's Referee: {battle?.current?.referee?.name}</p>

	<div>
		<button>Public</button>
		<button>Private</button>
	</div>

	<div>
		<label for="join-link">Join Link</label>
		<input readonly id="join-link" value="http://localhost:5173/battle/{battle.current.id}/lobby" />
		<button>Copy</button>
	</div>

	<div disabled={battle.current.visibility !== 'PUBLIC'}>
		<label for="watch-link">Watch Link</label>
		<input
			readonly
			id="watch-link"
			value="http://localhost:5173/battle/{battle.current.zero_room_id}/watch"
		/>
		<button>Copy</button>
	</div>
	<label for="overtime">Overtime</label>
	<select>
		<option value="5">5</option>
		<option value="10">10</option>
		<option value="15">15</option>
		<option value="20">20</option>
	</select>
	<button>Add Overtime</button>
{/if}

{#each battle.current?.participants as participant}
	<div>
		<p>{participant.user_id}</p>
		<p>{participant.status}</p>
	</div>
{/each}
<button onclick={start}>Start</button>

<!-- TODO add battlers from this screen -->
