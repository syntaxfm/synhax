<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		activeTab,
		class: className = '',
		children
	}: {
		id: string;
		activeTab: string;
		class?: string;
		children: Snippet;
	} = $props();

	let isActive = $derived(activeTab === id);
</script>

{#if isActive}
	<div class="tab-panel {className}" role="tabpanel" aria-labelledby="tab-{id}" id="panel-{id}">
		{@render children()}
	</div>
{/if}

<style>
	.tab-panel {
		width: 100%;
		height: 100%;
	}
</style>
