<script lang="ts">
	import type { Battle, Target } from '$sync/schema';
	import type { Snippet } from 'svelte';

	const {
		battle,
		detail,
		countdown
	}: { battle: Battle & { target: Target }; detail: Snippet; countdown: Snippet } = $props();
</script>

<header>
	<div class="target">
		<img src={battle.target.image} alt="Battle Image" />
		<p>The Target</p>
	</div>
	<div class="detail">
		{@render detail()}
	</div>
	{@render countdown()}
</header>

<style>
	header {
		display: grid;
		background: #222;
		gap: 20px;
		grid-template-columns: auto 1fr auto;
		border-bottom: 1px solid rgb(255 255 255 /0.1);
		box-shadow: 0 5px 10px rgb(0 0 0 / 0.2);
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
		font-size: 14px;
	}
</style>
