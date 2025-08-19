<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { z } from '$sync/client';
	import { Query } from 'zero-svelte';

	// 	- AESTHETIC from Pokemon battle / smash bros battle
	// - AUTO creates a unique ID for battle
	// - AUTO sets referee role to user
	// - CAN set all [BATTLE_SETTINGS]

	let battle = new Query(z.current.query.battles.where('id', page?.params?.id || '').one());

	function onupdate() {
		// Should save after each change
	}

	function ready() {
		if (battle.current) goto(`/battle/${battle.current.id}/ref`);
	}
</script>

{#if battle.current}
	<h1>Battle Settings</h1>
	<p>Today's Referee: {battle.current.referee_id}</p>

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
	<div>
		<label for="type">Type</label>
		<select id="type">
			<option value="TIME_TRIAL">Time Trial</option>
			<option value="TIMED_MATCH">Timed Match</option>
		</select>
	</div>

	<div>
		<label for="time-limit">Time Limit</label>
		<input
			defaultValue={battle.current.total_time_seconds}
			id="time-limit"
			type="number"
			placeholder="Enter time limit"
			required
		/>
	</div>
{/if}

<button onclick={ready}>Ready?</button>

<!-- TODO add battlers from this screen -->
<!-- GIve them a bell showing they have game invite -->
