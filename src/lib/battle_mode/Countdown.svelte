<script lang="ts">
	import Modal from '$lib/ui/Modal.svelte';
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

	let countdown = $derived(battle.total_time_seconds);
	let timer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (
			battle &&
			battle.type === 'TIMED_MATCH' &&
			['ACTIVE', 'COMPLETED'].includes(battle.status)
		) {
			timer = setInterval(() => {
				const now = Date.now();
				if (battle.ends_at && battle.ends_at > now) {
					status = 'ACTIVE';
					countdown = (battle.ends_at - now) / 1000;
				} else {
					make_over();
				}
			}, 100);
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

	function formatTime(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = Math.floor(seconds % 60);
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function getTimeChars(seconds: number): string[] {
		const timeString = formatTime(seconds);
		return timeString.split('');
	}
</script>

<div class="clock">
	<div class="time-display">
		{#each getTimeChars(countdown) as char, index}
			<span class="char" class:colon={char === ':'}>{char}</span>
		{/each}
	</div>
</div>

{#if view !== 'REF'}
	<Modal
		title={view === 'CODE' ? 'Pencils Down!' : 'Battle Over'}
		open={status === 'OVER' && ['ACTIVE', 'COMPLETED'].includes(battle.status)}
	>
		<p>Battle recap pending....</p>
		{#if view === 'CODE'}
			<a
				class="go_button button big_button"
				class:disabled={battle.status !== 'COMPLETED'}
				href={`/battle/${battle.id}/recap`}>Battle Recap</a
			>
		{/if}
		{#if view === 'WATCH'}
			<a
				class="go_button button big_button"
				class:disabled={battle.status !== 'COMPLETED'}
				href={`/battle/${battle.zero_room_id}/watch/vote`}>Vote for the winner</a
			>
		{/if}
	</Modal>
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

		.time-display {
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.char {
			font-family: 'TickingTimebombBB';
			color: rgb(from var(--pink) r g b / 0.5);
			text-shadow: 0 0 5px var(--pink);
			translate: 0 5px;
			margin: 0;
			text-box-trim: trim-both;
			/* Fixed width for each character */
			width: 0.5em;
			display: inline-block;
			text-align: center;
		}

		.char.colon {
			width: 0.2em; /* Narrower width for colon */
		}
	}
</style>
