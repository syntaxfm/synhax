<script lang="ts">
	import TargetListing from '$lib/targets/TargetListing.svelte';
	const { battle_select } = $props();
</script>

<section class:active={battle_select}>
	<h3>Latest Targets</h3>
	<TargetListing limit={10} />
</section>

<style>
	h3 {
		background: var(--hot);
		color: var(--black);
		padding: 6px 16px;
		font-size: 35px;
		display: inline-block;
		mask-image: url(/Grit%20Mask@2x.wqK0L7zb.png);
		mask-repeat: repeat;
		mask-size: 300px;
	}

	section {
		grid-row: 2 / 3;
		grid-column: 1 / -1;
		z-index: 1;
		opacity: 0;
		transition: opacity 0.2s ease-in-out;
		pointer-events: none;
		&.active {
			opacity: 1;
			pointer-events: all;
		}
	}
</style>
