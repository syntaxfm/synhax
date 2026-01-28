<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { authClient } from '$lib/auth-client';
	import { queries } from '$lib/queries';
	import { get_user_avatar_url } from '$lib/user/utils';
	import { z } from '$lib/zero.svelte';
	import { files } from '$lib/state/FileState.svelte';
	import Logo from '$lib/ui/Logo.svelte';

	const { children } = $props();

	async function logout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					goto('/');
				}
			}
		});
	}

	const user = z.createQuery(queries.user.current());
	const isAdmin = $derived(user.data?.role === 'syntax');

	const hideSidebarByDefault = $derived(
		page.url.pathname.startsWith('/recap') ||
			page.url.pathname.startsWith('/ref')
	);

	const adminSubLinks = [
		{ label: 'Users', href: '/admin/users' },
		{ label: 'Targets', href: '/admin/targets' },
		{ label: 'Battles', href: '/admin/battles' },
		{ label: 'Hax', href: '/admin/hax' }
	];

	// Silently check if user already has file system permission
	// This uses queryPermission() which doesn't require user interaction
	if (browser) {
		files.check();
	}
</script>

<div class="layout-sidebar fill" class:sidebar-hidden={hideSidebarByDefault}>
	<aside>
		<a class="logo" href="/dashboard">
			<Logo />
		</a>

		<nav class="sidebar-nav">
			<a
				href="/dashboard"
				aria-current={page.url.pathname === '/dashboard' ? 'page' : undefined}
				>Battles</a
			>
			<a
				href="/history"
				aria-current={page.url.pathname === '/history' ? 'page' : undefined}
				>History</a
			>
			<a
				href="/settings"
				aria-current={page.url.pathname === '/settings' ? 'page' : undefined}
				>Settings</a
			>
			{#if isAdmin}
				<a
					href="/admin"
					aria-current={page.url.pathname === '/admin' ? 'page' : undefined}
					>Admin</a
				>
				{#each adminSubLinks as link}
					<a
						class="nav-nested"
						href={link.href}
						aria-current={page.url.pathname === link.href ? 'page' : undefined}
						>{link.label}</a
					>
				{/each}
			{/if}
		</nav>

		<div class="sidebar-footer">
			<button class="user-button" popovertarget="user-menu-1">
				<span class="avatar bordered">
					<img
						src={get_user_avatar_url(user.data, '/unknown.png')}
						alt={user?.data?.name}
					/>
				</span>
				<span class="user-name">{user.data?.name || 'User'}</span>
			</button>
			<button class="logout-button" onclick={logout} title="Sign out">
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
					<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
					<polyline points="16 17 21 12 16 7" />
					<line x1="21" y1="12" x2="9" y2="12" />
				</svg>
			</button>
		</div>
	</aside>
	<section>
		{@render children()}
	</section>
</div>

<style>
	.layout-sidebar {
		min-height: 100vh;
		gap: 0;
	}

	.layout-sidebar > section {
		min-height: 0;
		display: flex;
		flex-direction: column;
		padding: var(--pad-l);
		overflow-y: auto;
	}

	aside {
		display: flex;
		flex-direction: column;
		padding: var(--pad-l);
		margin: var(--pad-l);
		border-radius: var(--br-l);
		background: var(--surface-1);
		border-right: 1px solid var(--border-subtle);
		background: rgba(23, 2, 45, 0.87);
	}

	.logo {
		display: block;
		margin-bottom: var(--pad-xl);
		padding-bottom: var(--pad-l);
		border-bottom: 1px solid var(--border-subtle);
	}

	.logo :global(svg) {
		width: 100%;
		padding: 10px 30px;
		height: auto;
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.sidebar-nav a {
		position: relative;
		display: block;
		padding: var(--pad-m) 0;
		padding-left: var(--pad-l);
		font-family: 'Jamboree', sans-serif;
		font-size: 1.1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg-10);
		text-decoration: none;
		border-radius: 0;
		border-left: 3px solid transparent;
		transition:
			color 0.15s ease,
			border-color 0.15s ease,
			text-shadow 0.15s ease;
	}

	.sidebar-nav a:hover {
		color: var(--fg);
		border-left-color: var(--fg-3);
	}

	.sidebar-nav a[aria-current='page'] {
		color: var(--primary);
		border-left-color: var(--primary);
		text-shadow: 0 0 20px oklch(from var(--primary) l c h / 0.5);
	}

	/* Arrow indicator for active item */
	.sidebar-nav a[aria-current='page']::before {
		content: '›';
		position: absolute;
		left: -0.1rem;
		color: var(--primary);
	}

	/* Nested nav links (admin sub-items) */
	a.nav-nested {
		padding-left: calc(var(--pad-l) + 1rem);
		font-size: var(--);
	}

	.nav-nested[aria-current='page'] {
		text-shadow: 0 0 15px oklch(from var(--primary) l c h / 0.4);
	}

	.sidebar-footer {
		margin-top: var(--pad-xl);
		padding-top: var(--pad-l);
		border-top: 1px solid var(--border-subtle);
		display: flex;
		align-items: center;
		gap: var(--pad-s);
	}

	.logout-button {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--pad-s);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--br-s);
		color: var(--fg-6);
		cursor: pointer;
		transition:
			background 0.1s ease,
			border-color 0.1s ease,
			color 0.1s ease;
	}

	.logout-button:hover {
		background: var(--surface-2);
		border-color: var(--border-subtle);
		color: var(--fg);
	}

	.user-button {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		gap: var(--pad-m);
		width: auto;
		padding: var(--pad-s);
		background: transparent;
		border: 1px solid transparent;
		border-radius: var(--br-s);
		cursor: pointer;
		transition:
			background 0.1s ease,
			border-color 0.1s ease;
	}

	.user-button:hover {
		background: var(--surface-2);
		border-color: var(--border-subtle);
	}

	.avatar {
		border-color: var(--primary);
		border-width: 2px;
		border-style: solid;
		--avatar-size: 1.75rem;
		flex-shrink: 0;
		width: var(--avatar-size);
		height: var(--avatar-size);
		overflow: hidden;
		border-radius: 50%;
		display: inline-block;
	}

	.avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.user-name {
		font-family: 'Jamboree', sans-serif;
		font-size: 0.9rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--fg-6);
		text-align: left;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.layout-sidebar.sidebar-hidden {
		grid-template-columns: 1fr;
	}

	.layout-sidebar.sidebar-hidden > aside {
		display: none;
	}

	/* Mobile layout */
	@media (max-width: 768px) {
		.layout-sidebar {
			display: flex;
			flex-direction: column;
		}

		aside {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			gap: var(--pad-m);
			padding: var(--pad-m);
			margin: var(--pad-s);
			border-radius: var(--br-m);
			border-right: none;
		}

		.logo {
			margin-bottom: 0;
			padding-bottom: 0;
			border-bottom: none;
			max-width: 200px;
		}

		.logo :global(svg) {
			padding: 5px 10px;
		}

		.sidebar-nav {
			flex-direction: row;
			flex-wrap: wrap;
			align-items: center;
			justify-content: center;
			gap: var(--pad-s);
		}

		.sidebar-nav a {
			padding: var(--pad-s) var(--pad-m);
			padding-left: var(--pad-m);
			font-size: 0.9rem;
			border-left: none;
			border-bottom: 2px solid transparent;
		}

		.sidebar-nav a:hover {
			border-left-color: transparent;
			border-bottom-color: var(--fg-3);
		}

		.sidebar-nav a[aria-current='page'] {
			border-left-color: transparent;
			border-bottom-color: var(--primary);
		}

		.sidebar-nav a[aria-current='page']::before {
			display: none;
		}

		a.nav-nested {
			padding-left: var(--pad-m);
			font-size: 0.8rem;
		}

		.sidebar-footer {
			margin-top: 0;
			padding-top: 0;
			border-top: none;
		}
	}
</style>
