<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Tab {
		id: string;
		label: string;
		disabled?: boolean;
	}

	let {
		tabs,
		activeTab = $bindable(tabs[0]?.id),
		class: className = '',
		onTabChange,
		active_tab
	}: {
		tabs: Tab[];
		activeTab?: string;
		class?: string;
		onTabChange?: (tabId: string) => void;
		active_tab: Snippet;
	} = $props();

	function setActiveTab(tabId: string) {
		activeTab = tabId;
		onTabChange?.(tabId);
	}
</script>

<div class="tab-group {className}">
	<div class="tab-list" role="tablist">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				class:disabled={tab.disabled}
				role="tab"
				aria-selected={activeTab === tab.id}
				aria-controls="panel-{tab.id}"
				disabled={tab.disabled}
				onclick={() => {
					if (!tab.disabled) {
						setActiveTab(tab.id);
					}
				}}
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<div class="tab-content">
		{@render active_tab()}
	</div>
</div>

<style>
	.tab-group {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.tab-list {
		display: flex;
		border-bottom: 2px solid var(--track-color, rgb(255 255 255 / 0.1));
		background: var(--tab-background, transparent);
	}

	.tab {
		background: transparent;
		border: none;
		padding: 8px 16px;
		cursor: pointer;
		font-weight: 600;
		color: var(--tab-color, rgb(255 255 255 / 0.7));
		transition: all 0.2s ease;
		position: relative;
		font-size: 14px;
		border-bottom: 2px solid transparent;
	}

	.tab:hover:not(.disabled) {
		color: var(--tab-hover-color, rgb(255 255 255 / 0.9));
		background: var(--tab-hover-background, rgb(255 255 255 / 0.05));
	}

	.tab.active {
		color: var(--indicator-color, var(--pink, #ff69b4));
		border-bottom-color: var(--indicator-color, var(--pink, #ff69b4));
	}

	.tab.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.tab-content {
		flex: 1;
		padding: var(--tab-content-padding, 16px 0);
	}
</style>
