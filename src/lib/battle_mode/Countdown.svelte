<script lang="ts">
	import Modal from '$lib/ui/Modal.svelte';
	import type { Battle } from '$sync/schema';

	let {
		battle,
		onover = () => null,
		onautoend,
		status = $bindable('ACTIVE'),
		view = 'WATCH'
	}: {
		battle: Battle;
		onover?: () => void;
		onautoend?: () => void;
		status?: 'ACTIVE' | 'OVER';
		view?: 'WATCH' | 'CODE' | 'REF';
	} = $props();

	let countdown = $state(600);
	let timer: ReturnType<typeof setInterval> | null = null;

	function update_countdown() {
		if (battle.status === 'COMPLETED') {
			make_over();
			return;
		}
		const hasTimer = !!battle.ends_at || !!battle.total_time_seconds;
		if (!hasTimer || !['ACTIVE', 'COMPLETED'].includes(battle.status ?? '')) {
			return;
		}
		const derivedEndsAt =
			battle.ends_at ??
			(battle.starts_at && battle.total_time_seconds
				? battle.starts_at + battle.total_time_seconds * 1000
				: null);

		const now = Date.now();
		if (derivedEndsAt && derivedEndsAt > now) {
			status = 'ACTIVE';
			countdown = (derivedEndsAt - now) / 1000;
		} else if (derivedEndsAt && derivedEndsAt <= now) {
			make_over();
		} else if (battle.total_time_seconds) {
			countdown = battle.total_time_seconds;
		}
		// If ends_at is not set yet, keep showing initial countdown value
	}

	$effect(() => {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		const hasTimer = !!battle.ends_at || !!battle.total_time_seconds;
		countdown = battle.total_time_seconds ?? 600;
		if (
			battle &&
			hasTimer &&
			['ACTIVE', 'COMPLETED'].includes(battle.status ?? '')
		) {
			update_countdown();
			const derivedEndsAt =
				battle.ends_at ??
				(battle.starts_at && battle.total_time_seconds
					? battle.starts_at + battle.total_time_seconds * 1000
					: null);
			if (
				battle.status === 'ACTIVE' &&
				(!derivedEndsAt || derivedEndsAt > Date.now())
			) {
				timer = setInterval(update_countdown, 100);
			}
		}
		return () => {
			if (timer) {
				clearInterval(timer);
				timer = null;
			}
		};
	});

	function make_over() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
		if (status === 'OVER') {
			countdown = 0;
			return;
		}
		countdown = 0;
		status = 'OVER';
		onover();
		if (
			(battle as Battle & { allow_time_extension?: boolean })
				.allow_time_extension === false &&
			battle.status === 'ACTIVE' &&
			onautoend
		) {
			onautoend();
		}
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

<div class="clock" data-view={view}>
	<div class="time-display">
		{#each getTimeChars(countdown) as char, index (index)}
			<span class="char" class:colon={char === ':'}>{char}</span>
		{/each}
	</div>
</div>

{#if view !== 'REF' && (battle as any).allow_time_extension !== false}
	<Modal
		title={view === 'CODE' ? 'Pencils Down!' : 'Battle Over'}
		open={status === 'OVER' &&
			['ACTIVE', 'COMPLETED'].includes(battle.status ?? 'PENDING')}
	>
		<p>Battle recap pending....</p>
		{#if view === 'CODE'}
			<a
				class="go_button button big_button"
				class:disabled={battle.status !== 'COMPLETED'}
				href={`/recap/${battle.id}`}>Battle Recap</a
			>
		{/if}
	</Modal>
{/if}

<style>
	.clock {
		font-size: 45px;
		border: solid 1px rgb(255 255 255 / 0.15);
		border-block-width: 0;
		&[data-view='REF'] {
			border-block-width: 1px;
			font-size: 100px; /* larger for ref view */
		}
		text-align: center;
		display: flex;
		justify-content: center;
		align-items: center;
		background: var(--black);
		padding: 0 10px;

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
