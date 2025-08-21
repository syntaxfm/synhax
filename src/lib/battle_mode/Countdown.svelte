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

<div class="clock">
	<p>{countdown.toFixed(1)}</p>
</div>

{#if view !== 'REF'}
	<dialog open={status === 'OVER' && ['ACTIVE', 'COMPLETED'].includes(battle.status)}>
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
	</dialog>
{/if}

<style>
	.clock {
		font-size: 100px;
		text-align: center;
		display: flex;
		border-radius: 4px;
		justify-content: center;
		align-items: center;
		background: #000;
		padding: 0 40px;
		margin: 10px;
		border: solid 1px rgb(255 255 255 / 0.2);
		p {
			font-family: 'TickingTimebombBB';
			color: rgb(from var(--pink) r g b / 0.5);
			text-shadow: 0 0 5px var(--pink);
			translate: 0 5px;
			margin: 0;
			text-box-trim: trim-both;
		}
	}
</style>
