<script lang="ts">
	import Table from '$lib/ui/Table.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import type { User } from '$sync/schema';
	import type { ColumnDef } from '@tanstack/svelte-table';
	import { get_user_avatar_url } from '$lib/user/utils';

	let users = z.createQuery(queries.user.all());

	const columns: ColumnDef<User, any>[] = [
		{
			id: 'avatar',
			header: '',
			accessorFn: (row) => row,
			cell: (info) => {
				const user = info.getValue() as User;
				const avatarUrl = get_user_avatar_url(user, '/unknown.png');
				return `<img src="${avatarUrl}" alt="${user.name}" class="user-avatar" />`;
			}
		},
		{
			accessorKey: 'name',
			header: 'Name',
			filterFn: 'includesString',
			enableColumnFilter: true,
			cell: (info) => {
				const row = info.row.original;
				const name = info.getValue() as string;
				const username = row.username;
				return `<a href="/admin/users/${row.id}" class="user-link">
					<span class="user-name">${name}</span>
					${username ? `<span class="user-username">@${username}</span>` : ''}
				</a>`;
			}
		},
		{
			accessorKey: 'email',
			header: 'Email',
			filterFn: 'includesString',
			enableColumnFilter: true
		},
		{
			accessorKey: 'createdAt',
			header: 'Signed Up',
			cell: (info) => {
				const timestamp = info.getValue() as number;
				if (!timestamp) return 'N/A';
				const date = new Date(timestamp);
				return date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'short',
					day: 'numeric'
				});
			}
		},
		{
			accessorKey: 'role',
			header: 'Role',
			filterFn: 'includesString',
			enableColumnFilter: true,
			cell: (info) => {
				const role = info.getValue() as string | null;
				if (!role) return '<span class="role-badge user">user</span>';
				const roleClass = role.toLowerCase();
				return `<span class="role-badge ${roleClass}">${role}</span>`;
			}
		},
		{
			accessorKey: 'emailVerified',
			header: 'Verified',
			cell: (info) => {
				const verified = info.getValue() as boolean;
				return verified
					? '<span class="verified-badge verified">✓ Verified</span>'
					: '<span class="verified-badge unverified">✗ Unverified</span>';
			}
		},
		{
			accessorKey: 'banned',
			header: 'Status',
			cell: (info) => {
				const banned = info.getValue() as boolean;
				return banned
					? '<span class="ban-badge banned">🚫 Banned</span>'
					: '<span class="ban-badge active">Active</span>';
			}
		}
	];
</script>

<svelte:head>
	<title>Users | Admin - Synhax</title>
</svelte:head>

<div class="stack" style:--gap="40px;">
	<h1 class="game-title">Users</h1>
	<Table data={users.data} {columns} />
</div>

<style>
	:global(.user-avatar) {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		object-fit: cover;
		border: 2px solid var(--border-subtle);
	}

	:global(.user-link) {
		display: flex;
		flex-direction: column;
		gap: 2px;
		text-decoration: none;
		color: inherit;
	}

	:global(.user-link:hover .user-name) {
		color: var(--yellow);
	}

	:global(.user-name) {
		font-weight: 600;
		transition: color 0.15s ease;
	}

	:global(.user-username) {
		font-size: 0.75rem;
		color: var(--slate);
	}

	:global(.role-badge) {
		display: inline-block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 3px 8px;
		border-radius: 999px;
		background: var(--surface-0);
	}

	:global(.role-badge.syntax) {
		border: 1px solid var(--pink);
		color: var(--pink);
	}

	:global(.role-badge.user) {
		border: 1px solid var(--border-default);
		color: var(--slate);
	}

	:global(.verified-badge) {
		display: inline-block;
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 4px;
	}

	:global(.verified-badge.verified) {
		color: var(--green);
		background: rgb(34 197 94 / 0.1);
	}

	:global(.verified-badge.unverified) {
		color: var(--slate);
		background: var(--surface-0);
	}

	:global(.ban-badge) {
		display: inline-block;
		font-size: 11px;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 4px;
	}

	:global(.ban-badge.banned) {
		color: var(--red, #ff4444);
		background: rgb(255 68 68 / 0.1);
	}

	:global(.ban-badge.active) {
		color: var(--green);
		background: rgb(34 197 94 / 0.1);
	}
</style>
