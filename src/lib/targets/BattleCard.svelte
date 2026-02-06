<script lang="ts">
	import { type Battle, type Target } from '$sync/schema';
	import { formatBattleStatus } from '$lib/constants';
	import { onMount } from 'svelte';

	const {
		battle
	}: {
		battle: Battle & {
			target?: Target | null | undefined;
		};
	} = $props();

	// Live countdown for active battles
	let now = $state(Date.now());

	onMount(() => {
		if (battle.status !== 'ACTIVE') return;

		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Calculate time remaining for active battles
	const timeRemaining = $derived.by(() => {
		if (battle.status !== 'ACTIVE' || !battle.ends_at) return null;

		const remaining = battle.ends_at - now;
		if (remaining <= 0) return { minutes: 0, seconds: 0, expired: true };

		const minutes = Math.floor(remaining / 60000);
		const seconds = Math.floor((remaining % 60000) / 1000);

		return { minutes, seconds, expired: false };
	});

	// Format time remaining as MM:SS
	const formattedTime = $derived.by(() => {
		if (!timeRemaining) return null;
		const m = String(timeRemaining.minutes).padStart(2, '0');
		const s = String(timeRemaining.seconds).padStart(2, '0');
		return `${m}:${s}`;
	});

	// Determine the correct link based on battle status
	const battleLink = $derived.by(() => {
		switch (battle.status) {
			case 'PENDING':
				return `/lobby/${battle.id}`;
			case 'READY':
				return `/battle/${battle.id}/code`;
			case 'ACTIVE':
				return `/battle/${battle.id}/code`;
			case 'COMPLETED':
				return `/recap/${battle.id}`;
			default:
				return `/battle/${battle.id}`;
		}
	});

	// Status badge styling
	const statusColor = $derived.by(() => {
		switch (battle.status) {
			case 'PENDING':
				return 'var(--yellow)';
			case 'READY':
				return 'var(--blue)';
			case 'ACTIVE':
				return 'var(--green)';
			case 'COMPLETED':
				return 'var(--slate)';
			default:
				return 'var(--slate)';
		}
	});

	// Time urgency level for styling
	const timeUrgency = $derived.by(() => {
		if (!timeRemaining || timeRemaining.expired) return 'expired';
		if (timeRemaining.minutes < 1) return 'critical';
		if (timeRemaining.minutes < 5) return 'warning';
		return 'normal';
	});
</script>

<article class="battle-card">
	<!-- Image with rounded corners, inset from card edge -->
	<div class="image-wrapper">
		{#if battle.target?.image}
			<img
				src={battle.target.image}
				alt={battle.target.name ?? 'Battle target'}
			/>
		{:else}
			<div class="no-image">No Image</div>
		{/if}
		{#if battle.target?.image}
			<button
				class="preview-btn"
				popovertarget="preview-battle-{battle.id}"
				aria-label="Preview full size"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="18"
					height="18"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="15 3 21 3 21 9"></polyline>
					<polyline points="9 21 3 21 3 15"></polyline>
					<line x1="21" y1="3" x2="14" y2="10"></line>
					<line x1="3" y1="21" x2="10" y2="14"></line>
				</svg>
			</button>
		{/if}
	</div>

	{#if battle.target?.image}
		<div id="preview-battle-{battle.id}" popover class="preview-popover">
			<img
				src={battle.target.image}
				alt={battle.target.name ?? 'Battle target'}
			/>
		</div>
	{/if}

	<!-- Content overlaps bottom of image via negative margin -->
	<div class="content">
		<div class="title-row">
			<h2>{battle.name || battle.target?.name || 'Unknown Target'}</h2>
			<span class="status-badge" style="--status-color: {statusColor}">
				{formatBattleStatus(battle.status)}
			</span>
		</div>

		<div class="meta">
			<span class="tag" class:private={battle.visibility === 'PRIVATE'}>
				{#if battle.visibility === 'PRIVATE'}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
				{:else}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="2" y1="12" x2="22" y2="12"></line>
						<path
							d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
						></path>
					</svg>
				{/if}
				{battle.visibility}
			</span>
			<span class="room-id">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="12"
					height="12"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path
						d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
					></path>
				</svg>
				{battle.zero_room_id.slice(0, 8)}…
			</span>
			{#if battle.status === 'ACTIVE' && formattedTime}
				<span
					class="time-remaining"
					class:critical={timeUrgency === 'critical'}
					class:warning={timeUrgency === 'warning'}
					class:expired={timeUrgency === 'expired'}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="10"></circle>
						<polyline points="12 6 12 12 16 14"></polyline>
					</svg>
					{#if timeRemaining?.expired}
						Time's up!
					{:else}
						{formattedTime}
					{/if}
				</span>
			{/if}
		</div>
	</div>

	<!-- Button at bottom with pill shape -->
	<div class="action">
		<a href={battleLink} class="button">
			{#if battle.status === 'PENDING'}
				Join Lobby
			{:else if battle.status === 'READY'}
				Enter Lobby
			{:else if battle.status === 'ACTIVE'}
				Continue Battle
			{:else}
				View Recap
			{/if}
		</a>
	</div>
</article>

<style>
	.battle-card {
		--card-padding: var(--pad-l);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--br-m);
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		transition: border-color 0.15s ease;
		&:hover {
			border-color: var(--border-default);
		}
	}

	.image-wrapper {
		position: relative;
		aspect-ratio: 1 / 1;
		border-radius: var(--br-s);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
	}

	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(30px);
	}

	.no-image {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-2);
		color: var(--fg-5);
		font-size: 0.75rem;
	}

	.preview-btn {
		position: absolute;
		top: var(--pad-s);
		right: var(--pad-s);
		z-index: 1;
		width: 1.75rem;
		height: 1.75rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-0);
		border: 1px solid var(--border-default);
		border-radius: var(--br-s);
		padding: 0;
		cursor: pointer;
		color: var(--fg);
		opacity: 0;
		transition: opacity 0.15s ease;

		&:hover {
			background: var(--surface-2);
		}
	}

	.image-wrapper:hover .preview-btn {
		opacity: 1;
	}

	.preview-popover {
		position: fixed;
		inset: 0;
		margin: auto;
		border: none;
		border-radius: var(--br-m);
		background: var(--surface-1);
		padding: var(--pad-m);
		box-shadow: var(--shadow-5);
		max-width: 90vw;
		max-height: 90vh;
		width: fit-content;
		height: fit-content;

		&::backdrop {
			background: oklch(0 0 0 / 0.85);
		}

		img {
			max-width: 100%;
			max-height: 85vh;
			border-radius: var(--br-s);
			filter: blur(30px);
			object-fit: contain;
		}
	}

	.content {
		display: flex;
		flex-direction: column;
		--gap: 20px;
		gap: var(--gap);
		margin-block: var(--gap);
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--pad-s);
	}

	h2 {
		font-size: var(--step-2);
		font-weight: 600;
		margin: 0;
		line-height: 1.3;
	}

	.status-badge {
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: var(--pad-xs) var(--pad-m);
		background: transparent;
		border: 1px solid var(--status-color);
		border-radius: var(--br-s);
		white-space: nowrap;
		color: var(--status-color);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--pad-s);
	}

	.tag {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xs);
		font-size: 0.65rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		padding: var(--pad-xs) var(--pad-s);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		color: var(--fg-7);

		&.private {
			border-color: oklch(from var(--yellow) l c h / 0.3);
			color: var(--yellow);
		}
	}

	.room-id {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xs);
		font-size: 0.65rem;
		font-family: var(--font-mono, monospace);
		padding: var(--pad-xs) var(--pad-s);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		color: var(--fg-5);
	}

	.time-remaining {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xs);
		font-size: 0.7rem;
		font-weight: 600;
		font-family: var(--font-mono, monospace);
		padding: var(--pad-xs) var(--pad-m);
		background: transparent;
		border: 1px solid var(--green);
		border-radius: var(--br-s);
		color: var(--green);
		letter-spacing: 0.03em;

		&.warning {
			border-color: var(--yellow);
			color: var(--yellow);
			animation: pulse 1s ease-in-out infinite;
		}

		&.critical {
			border-color: var(--red);
			color: var(--red);
			animation: pulse 0.5s ease-in-out infinite;
		}

		&.expired {
			border-color: var(--fg-3);
			color: var(--fg-5);
			animation: none;
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	.action {
		.button {
			display: block;
			width: 100%;
			text-align: center;
			text-decoration: none;
			background: hsl(from var(--purple) h s 6%);
			border: 1px solid rgb(255 255 255 / 0.18);
			border-radius: 999px;
			color: var(--yellow);
			letter-spacing: 0.08em;
			text-transform: uppercase;
			padding: 0.8rem 1.25rem;
			box-shadow:
				0 12px 24px rgb(0 0 0 / 0.4),
				0 1px 0 rgb(255 255 255 / 0.08) inset;
			transition:
				transform 0.15s ease,
				box-shadow 0.2s ease,
				background 0.2s ease;
			&:hover {
				background: hsl(from var(--black) h s 10%);
				box-shadow:
					0 16px 30px rgb(0 0 0 / 0.5),
					0 1px 0 rgb(255 255 255 / 0.1) inset;
				transform: translateY(-1px);
			}
		}
	}
</style>
