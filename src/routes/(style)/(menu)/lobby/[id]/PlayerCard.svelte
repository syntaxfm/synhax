<script lang="ts">
	import { z } from '$lib/zero.svelte';

	type ParticipantStatus =
		| 'PENDING'
		| 'ACTIVE'
		| 'READY'
		| 'DROPPED'
		| 'FINISHED'
		| null;

	type Battler = {
		user_id: string;
		status: ParticipantStatus;
		user?: {
			username?: string | null;
			name: string;
			image?: string | null;
		};
	};

	type Props = {
		battler: Battler;
		onlockin: () => void;
		onleave: () => void;
	};

	const { battler, onlockin, onleave }: Props = $props();

	let is_me = $derived(battler.user_id === z.userID);
	let is_ready = $derived(battler.status === 'READY');
	let user = $derived(
		battler.user ?? {
			name: 'Anonymous',
			username: null,
			image: null
		}
	);

	// GitHub username stored from OAuth
	let username = $derived(user.username || user.name || 'Anonymous');

	function get_initials(name: string | null | undefined): string {
		if (!name) return '??';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<article class="player-card stack" class:ready={is_ready}>
	<div class="card-frame">
		<div class="card-inner">
			<div class="card-photo">
				{#if user.image}
					<img src={user.image} alt={username} />
				{:else}
					<span class="initials">{get_initials(user.name)}</span>
				{/if}

				<div class="card-status" class:ready={is_ready}>
					<span class="status-text"
						>{is_ready ? 'Locked In' : 'Warming Up'}</span
					>
				</div>
			</div>
			<div class="card-nameplate">
				<span class="player-name">{username}</span>
			</div>
		</div>
	</div>

	{#if is_me}
		<div class="cluster" style="justify-content: center;">
			{#if !is_ready}
				<button class="battle-button" onclick={onlockin}>Lock In</button>
			{/if}
			<button class="battle-button battle-button--ghost" onclick={onleave}>
				Leave
			</button>
		</div>
	{/if}
</article>

<style>
	.player-card {
		--gap: var(--pad-xs);
	}

	.card-frame {
		background: hsl(from var(--black) h s 6%);
		border-radius: var(--br-m);
		padding: var(--pad-xs);
		border: 1px solid rgb(255 255 255 / 0.08);
		box-shadow:
			0 16px 24px rgb(0 0 0 / 0.35),
			0 1px 0 rgb(255 255 255 / 0.05) inset;
	}

	.player-card.ready .card-frame {
		border-color: rgb(34 197 94 / 0.4);
		box-shadow:
			0 18px 28px rgb(0 0 0 / 0.4),
			0 1px 0 rgb(255 255 255 / 0.08) inset,
			0 0 18px rgb(34 197 94 / 0.25);
	}

	.card-inner {
		background: hsl(from var(--black) h s 4%);
		border-radius: var(--br-s);
		overflow: hidden;
	}

	.card-photo {
		aspect-ratio: 1;
		background: hsl(from var(--black) h s 8%);
		display: grid;
		place-items: center;
		overflow: hidden;
		position: relative;
	}

	.card-photo img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.card-photo .initials {
		font-size: 2.2rem;
		font-weight: 700;
		color: var(--fg-5);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.card-status {
		position: absolute;
		bottom: var(--pad-s);
		left: 50%;
		transform: translateX(-50%);
		background: rgb(0 0 0 / 0.7);
		padding: var(--pad-xs) var(--pad-s);
		border-radius: 999px;
		border: 1px solid rgb(255 255 255 / 0.2);
		box-shadow: 0 10px 18px rgb(0 0 0 / 0.4);
		white-space: nowrap;
	}

	.card-status.ready {
		border-color: rgb(34 197 94 / 0.6);
		color: var(--white);
	}

	.status-text {
		font-weight: 600;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: var(--white);
	}

	.card-nameplate {
		background: hsl(from var(--black) h s 6%);
		padding: var(--pad-m) var(--pad-xs);
		text-align: center;
		position: relative;
		border-top: 1px solid rgb(255 255 255 / 0.08);
	}

	.player-name {
		font-weight: 700;
		font-size: 1.2rem;
		line-height: 1.2;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--white);
	}
</style>
