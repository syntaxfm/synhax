<script lang="ts">
	import Bread from '$lib/ui/Bread.svelte';
	import AdminNav from './AdminNav.svelte';
	const { children } = $props();
</script>

<div class="wrap">
	<AdminNav />
	<main>
		<Bread />

		<div>
			{@render children()}
		</div>
	</main>
</div>

<style>
	main {
		padding: 1rem;
		display: grid;
		gap: 20px;
		font-size: 14px;
	}
	.wrap {
		display: grid;

		grid-template-columns: 150px 1fr;
	}
</style>
