<script lang="ts">
	import type { Battle, Target } from '$sync/schema';
	import type { Snippet } from 'svelte';

	const {
		battle,
		detail,
		countdown,
		target = true
	}: {
		battle: Battle & { target: Target };
		detail: Snippet;
		countdown: Snippet;
		target: boolean;
	} = $props();
</script>

<header>
	<div class="target">
		{#if target}
			<img src={battle.target.image} alt="Battle Image" />
			<p>The Target</p>
		{/if}
	</div>
	{@render countdown()}
	<div class="detail">
		{@render detail()}
	</div>
</header>

<style>
	header {
		display: grid;
		background: var(--black);
		gap: 20px;
		grid-template-columns: 1fr auto 1fr;
		box-shadow:
			0 5px 10px rgb(0 0 0 / 0.2),
			0 -1px 1px rgb(255 255 255 / 0.1) inset;
	}

	.target {
		position: relative;
		p {
			background: var(--pink);
			position: absolute;
			font-weight: 900;
			top: 0;
			left: 0;
			padding: 4px 10px;
		}
		img {
			width: 100%;
			max-width: 200px;
		}
	}

	.detail {
		padding: 20px;
		text-align: right;
		font-size: 14px;
	}
</style>
