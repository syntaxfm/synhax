<script lang="ts">
	import type { Battle } from '$sync/schema';

	let {
		battle,
		onover = () => null,
		status = $bindable('ACTIVE'),
		view = 'WATCH'
	}: {
		battle: Battle;
		onover?: () => void;
		status?: 'ACTIVE' | 'OVER';
		view?: 'WATCH' | 'CODE' | 'REF';
	} = $props();

	let countdown = $state(0);
	let timer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (battle && battle.type === 'TIMED_MATCH') {
			timer = setInterval(() => {
				const now = Date.now();
				if (battle.ends_at && battle.ends_at > now) {
					status = 'ACTIVE';
					countdown = (battle.ends_at - now) / 1000;
				} else {
					make_over();
				}
			}, 100);
		} else {
			make_over();
		}

		return () => {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		};
	});

	function make_over() {
		countdown = 0;
		status = 'OVER';
		onover();
	}
</script>

<div>
	Started At: {battle.starts_at
		? new Date(battle.starts_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		: 'Not set'}
	Ends At: {battle.ends_at
		? new Date(battle.ends_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		: 'Not set'}
	<p>Clock: {countdown.toFixed(1)} seconds</p>
</div>

{#if view !== 'REF'}
	{#if status === 'OVER'}
		<p>
			{#if view === 'CODE'}Pencils down!{/if}
			{#if view === 'WATCH'}The battle is over{/if}
		</p>

		{#if battle.status === 'COMPLETED'}
			{#if view === 'CODE'}
				<a href={`/battle/${battle.id}/recap`}>Battle Recap</a>
			{/if}
			{#if view === 'WATCH'}
				<a href={`/battle/${battle.zero_room_id}/watch/vote`}>Vote for the winner</a>
			{/if}
		{:else}
			<p>Battle recap pending....</p>
		{/if}
	{/if}
{/if}
