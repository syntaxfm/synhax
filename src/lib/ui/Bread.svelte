<script lang="ts">
	import { page } from '$app/state';
	// Modern SvelteKit: use the 'page' store directly
	const crumbs = $derived.by(() => {
		const path = page.url.pathname;
		const match = path.match(/\/admin(.*)/);
		let rest = match ? match[1] : '';
		let segments = rest.split('/').filter(Boolean);
		let crumbs = [];
		let current = '/admin';
		for (let i = 0; i < segments.length; i++) {
			current += '/' + segments[i];
			crumbs.push({
				label: segments[i].replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
				href: current
			});
		}
		return crumbs;
	});
</script>

<nav aria-label="Breadcrumb">
	<a href="/admin">Admin</a>
	{#each crumbs as crumb, i (crumb.href + 'breads')}
		<span
			><svg xmlns="http://www.w3.org/2000/svg" width="12" viewBox="0 0 48 48"
				><title>right-arrow</title><g fill="#fff" stroke-linejoin="miter" stroke-linecap="butt"
					><polyline
						fill="none"
						stroke="#fff"
						stroke-width="2"
						stroke-linecap="square"
						stroke-miterlimit="10"
						points="14,4 34,24 14,44 "
						stroke-linejoin="miter"
					></polyline></g
				></svg
			></span
		>
		{#if i < crumbs.length - 1}
			<a href={crumb.href}>{crumb.label}</a>
		{:else}
			<span>{crumb.label}</span>
		{/if}
	{/each}
</nav>

<style>
	nav {
		display: flex;
		gap: 8px;
		align-items: center;
		font-size: 14px;
		a {
			color: var(--white);
		}
	}
</style>
