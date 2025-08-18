<script lang="ts">
	import type { UserState } from '$lib/state/UserState.svelte';

	const { user }: { user: UserState } = $props();
</script>

<section>
	<button onclick={() => user.setup_synhax_directory()}>
		{#if user.status !== 'READY'}Configure
		{:else}
			Change
		{/if} Project Directory
	</button>

	{#each user.projects as project}
		<button onclick={() => user.load_project(project)}>
			{project.name}
		</button>
	{/each}
</section>

<style>
	section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: var(--border);
	}
</style>
