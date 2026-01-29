<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { get_user_avatar_url } from '$lib/user/utils';
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	// Type for battle with relations
	type BattleWithRelations = {
		id: string;
		status: 'PENDING' | 'READY' | 'ACTIVE' | 'COMPLETED' | null;
		name: string | null;
		visibility: 'PUBLIC' | 'PRIVATE' | null;
		zero_room_id: string;
		target_id: string;
		ends_at: number | null;
		target?: {
			id: string;
			name: string;
			image: string;
		} | null;
		participants?: readonly {
			id: string;
			user_id: string;
			status: string | null;
			user?: {
				id: string;
				name: string;
				username?: string | null;
				image?: string | null;
				avatar?: string | null;
			} | null;
		}[];
	};

	let battles = z.createQuery(queries.battles.allWithRelations());
	const baseUrl = $derived(page.url.origin);

	// Live countdown for active battles
	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);

		return () => clearInterval(interval);
	});

	// Format time remaining as MM:SS
	function formatTimeRemaining(ends_at: number | null): string | null {
		if (!ends_at) return null;

		const remaining = ends_at - now;
		if (remaining <= 0) return "Time's up!";

		const minutes = Math.floor(remaining / 60000);
		const seconds = Math.floor((remaining % 60000) / 1000);
		const m = String(minutes).padStart(2, '0');
		const s = String(seconds).padStart(2, '0');

		return `${m}:${s}`;
	}

	// Get time urgency class
	function getTimeUrgency(ends_at: number | null): string {
		if (!ends_at) return '';
		const remaining = ends_at - now;
		if (remaining <= 0) return 'expired';
		if (remaining < 60000) return 'critical';
		if (remaining < 300000) return 'warning';
		return 'normal';
	}

	const columns: ColumnDef<BattleWithRelations, any>[] = [
		{
			id: 'name',
			header: 'Battle Name',
			accessorFn: (row) => row.name,
			cell: (info) => {
				const name = info.getValue() as string | null;
				if (!name) return '<span class="muted">—</span>';
				return `<span>${name}</span>`;
			}
		},
		{
			id: 'target',
			header: 'Target',
			accessorFn: (row) => row.target,
			cell: (info) => {
				const target = info.getValue() as BattleWithRelations['target'];
				if (!target) return 'No target';
				return `<a href="/admin/targets/${target.id}/edit" class="target-cell">
					<img src="${target.image}" alt="${target.name}" class="target-thumb" />
					<span>${target.name}</span>
				</a>`;
			}
		},
		{
			id: 'participants',
			header: 'Players',
			accessorFn: (row) => row.participants,
			cell: (info) => {
				const participants =
					info.getValue() as BattleWithRelations['participants'];
				if (!participants || participants.length === 0)
					return '<span class="muted">No players</span>';

				const readyParticipants = participants.filter(
					(p) => p.status === 'READY'
				);
				if (readyParticipants.length === 0)
					return '<span class="muted">No players locked in</span>';

				return `<div class="participants-cell">
					${readyParticipants
						.map((p) => {
							const avatarUrl = get_user_avatar_url(p.user, '/unknown.png');
							const name = p.user?.username || p.user?.name || 'Anonymous';
							return `<div class="participant" title="${name}">
								<img src="${avatarUrl}" alt="${name}" />
							</div>`;
						})
						.join('')}
					<span class="participant-count">${readyParticipants.length} player${readyParticipants.length !== 1 ? 's' : ''}</span>
				</div>`;
			}
		},
		{
			accessorKey: 'status',
			header: 'Status',
			cell: (info) => {
				const row = info.row.original;
				const status = info.getValue() as string;
				const statusClass = status?.toLowerCase() || 'unknown';

				// For active battles with countdown, show time inside the badge
				if (status === 'ACTIVE' && row.ends_at) {
					const timeRemaining = formatTimeRemaining(row.ends_at);
					const urgency = getTimeUrgency(row.ends_at);
					if (timeRemaining) {
						return `<span class="status-badge ${statusClass} with-time ${urgency}">ACTIVE · ${timeRemaining}</span>`;
					}
				}

				return `<span class="status-badge ${statusClass}">${status || 'Unknown'}</span>`;
			}
		},
		{
			accessorKey: 'visibility',
			header: 'Visibility',
			cell: (info) => {
				const visibility = info.getValue() as string;
				const visClass = visibility?.toLowerCase() || 'unknown';
				return `<span class="visibility-badge ${visClass}">${visibility || 'Unknown'}</span>`;
			}
		},
		{
			id: 'links',
			header: 'Views & Copy',
			accessorFn: (row) => row.id,
			cell: (info) => {
				const id = info.getValue() as string;
				const copyHandler = (url: string) =>
					`navigator.clipboard.writeText('${url}').then(() => this.classList.add('copied')).then(() => setTimeout(() => this.classList.remove('copied'), 1000))`;

				return `<div class="views-bar">
					<a href="/lobby/${id}" class="view-link">🚪 Lobby</a>
					<button class="copy-icon-btn" onclick="${copyHandler(`${baseUrl}/lobby/${id}`)}" title="Copy Lobby URL">📋</button>
					<span class="view-divider"></span>
					<a href="/battle/${id}/code" class="view-link">💻 Code</a>
					<button class="copy-icon-btn" onclick="${copyHandler(`${baseUrl}/battle/${id}/code`)}" title="Copy Code URL">📋</button>
					<span class="view-divider"></span>
					<a href="/ref/${id}" class="view-link">👨‍⚖️ Ref</a>
					<button class="copy-icon-btn" onclick="${copyHandler(`${baseUrl}/ref/${id}`)}" title="Copy Ref URL">📋</button>
					<span class="view-divider"></span>
					<a href="/recap/${id}" class="view-link">📊 Recap</a>
					<button class="copy-icon-btn" onclick="${copyHandler(`${baseUrl}/recap/${id}`)}" title="Copy Recap URL">📋</button>
					<span class="view-divider"></span>
					<span class="id-label">🆔 ${id.slice(0, 4)}…</span>
					<button class="copy-icon-btn" onclick="${copyHandler(id)}" title="Copy Battle ID">📋</button>
				</div>`;
			}
		}
	];
</script>

<svelte:head>
	<title>Battles | Admin - Synhax</title>
</svelte:head>

<div class="stack" style:--gap="20px;">
	<h1 class="game-title">Battles</h1>
	<Table data={battles.data} {columns} />
</div>

<style>
	:global(.target-cell) {
		display: flex;
		align-items: center;
		gap: var(--pad-m);
		text-decoration: none;
		color: inherit;
	}

	:global(.target-cell:hover) {
		color: var(--yellow);
	}

	:global(.target-thumb) {
		width: 2rem;
		height: 2rem;
		border-radius: var(--br-s);
		object-fit: cover;
		border: 1px solid var(--border-subtle);
	}

	:global(.participants-cell) {
		display: flex;
		align-items: center;
		gap: var(--pad-xs);
	}

	:global(.participant) {
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 50%;
		overflow: hidden;
		border: 2px solid var(--surface-1);
		margin-right: -0.5rem;
	}

	:global(.participant img) {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	:global(.participant-count) {
		margin-left: var(--pad-m);
		font-size: 0.7rem;
		color: var(--fg-5);
	}

	:global(.status-badge) {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: var(--pad-xs) var(--pad-m);
		border-radius: var(--br-s);
		background: transparent;
	}

	:global(.status-badge.pending) {
		border: 1px solid var(--yellow);
		color: var(--yellow);
	}

	:global(.status-badge.ready) {
		border: 1px solid var(--blue);
		color: var(--blue);
	}

	:global(.status-badge.active) {
		border: 1px solid var(--green);
		color: var(--green);
	}

	:global(.status-badge.active.warning) {
		border-color: var(--yellow);
		color: var(--yellow);
		animation: pulse 1s ease-in-out infinite;
	}

	:global(.status-badge.active.critical) {
		border-color: var(--red);
		color: var(--red);
		animation: pulse 0.5s ease-in-out infinite;
	}

	:global(.status-badge.active.expired) {
		border-color: var(--fg-3);
		color: var(--fg-5);
		animation: none;
	}

	:global(.status-badge.completed) {
		border: 1px solid var(--fg-3);
		color: var(--fg-5);
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

	:global(.visibility-badge) {
		display: inline-block;
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: var(--pad-xs) var(--pad-m);
		border-radius: var(--br-s);
		background: transparent;
	}

	:global(.visibility-badge.public) {
		border: 1px solid var(--border-default);
		color: var(--fg-7);
	}

	:global(.visibility-badge.private) {
		border: 1px solid oklch(from var(--yellow) l c h / 0.4);
		color: var(--yellow);
	}

	:global(.muted) {
		color: var(--fg-5);
		font-style: italic;
	}

	:global(.views-bar) {
		display: flex;
		align-items: center;
		gap: var(--pad-s);
		padding: var(--pad-s) var(--pad-m);
		background: var(--surface-0);
		border-radius: var(--br-s);
		border: 1px solid var(--border-subtle);
	}

	:global(.view-link) {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xs);
		padding: var(--pad-xs) var(--pad-s);
		font-size: 0.65rem;
		font-weight: 600;
		border-radius: var(--br-xs);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--fg-7);
		text-decoration: none;
		transition: background 0.15s ease;
		margin: 0;
		white-space: nowrap;
	}

	:global(.view-link:hover) {
		background: var(--surface-3);
		color: var(--yellow);
	}

	:global(.view-divider) {
		width: 1px;
		height: 1rem;
		background: var(--border-subtle);
	}

	:global(.id-label) {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xs);
		padding: var(--pad-xs) var(--pad-s);
		font-size: 0.65rem;
		font-weight: 600;
		font-family: var(--font-mono, monospace);
		border-radius: var(--br-xs);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		color: var(--fg-5);
		white-space: nowrap;
	}

	:global(.copy-icon-btn) {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.25rem;
		height: 1.25rem;
		padding: 0;
		margin: 0;
		font-size: 0.7rem;
		border-radius: var(--br-xs);
		border: 1px solid var(--border-subtle);
		background: var(--surface-2);
		color: var(--fg-5);
		cursor: pointer;
		transition: background 0.15s ease;
	}

	:global(.copy-icon-btn:hover) {
		background: var(--surface-3);
		color: var(--fg);
	}

	:global(.copy-icon-btn.copied) {
		background: oklch(from var(--green) l c h / 0.2);
		border-color: var(--green);
		color: var(--green);
	}
</style>
