<script lang="ts">
	const { children } = $props();
</script>

<div class="screen">
	{@render children()}
</div>

<style>
	.screen {
		display: grid;
		color: var(--white);
		padding: 60px 100px;
		gap: 60px;
		justify-content: center;
		overflow-x: hidden;
		max-width: 100vw;
		min-height: 100vh;
		grid-template-rows: auto 1fr;
	}
</style>
