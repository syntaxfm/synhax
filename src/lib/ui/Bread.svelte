<script lang="ts">
	import { page } from '$app/state';

	const crumbs = $derived.by(() => {
		const path = page.url.pathname;
		const match = path.match(/\/admin(.*)/);
		const rest = match ? match[1] : '';
		const segments = rest.split('/').filter(Boolean);
		const result: { label: string; href: string }[] = [];
		let current = '/admin';
		for (const segment of segments) {
			current = `${current}/${segment}`;
			result.push({
				label: segment
					.replace(/[-_]/g, ' ')
					.replace(/\b\w/g, (c) => c.toUpperCase()),
				href: current
			});
		}
		return result;
	});
</script>

<nav class="breadcrumbs" aria-label="Breadcrumb">
	<ul class="no-list">
		<li><a href="/admin">Admin</a></li>
		{#each crumbs as crumb, i (crumb.href + 'breads')}
			{#if i < crumbs.length - 1}
				<li><a href={crumb.href}>{crumb.label}</a></li>
			{:else}
				<li aria-current="page">{crumb.label}</li>
			{/if}
		{/each}
	</ul>
</nav>
