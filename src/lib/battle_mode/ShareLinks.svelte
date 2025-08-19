<script lang="ts">
	import type { Battle } from '$sync/schema';
	const {
		battle,
		code = true,
		watch = true,
		recap = false
	}: {
		battle: Battle;
		code?: boolean;
		watch?: boolean;
		recap?: boolean;
	} = $props();
</script>

{#if code}
	<div>
		<label for="join-link">Join Link</label>
		<input readonly id="join-link" value="http://localhost:5173/battle/{battle.id}/lobby" />
		<button>Copy</button>
	</div>
{/if}

{#if watch}
	<div>
		<label for="watch-link">Watch Link</label>
		<input
			disabled={battle.visibility !== 'PUBLIC'}
			readonly
			id="watch-link"
			value="http://localhost:5173/battle/{battle.zero_room_id}/watch"
		/>
		<button disabled={battle.visibility !== 'PUBLIC'}>Copy</button>
	</div>
{/if}

{#if recap}
	<div>
		<label for="vote-link">Vote Link</label>
		<input
			disabled={battle.visibility !== 'PUBLIC'}
			readonly
			id="vote-link"
			value="http://localhost:5173/battle/{battle.zero_room_id}/vote"
		/>
		<button disabled={battle.visibility !== 'PUBLIC'}>Copy</button>
	</div>
{/if}

<!-- TODO copy to copy -->
