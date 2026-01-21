<script lang="ts">
	import Logout from '$lib/user/Logout.svelte';
	import { files } from '$lib/state/FileState.svelte';
	import { z, queries } from '$lib/zero.svelte';

	const user = z.createQuery(queries.user.current());

	const current_folder = $derived(
		files.synhax_directory_handle?.name ?? 'Not connected'
	);
	const has_folder = $derived(Boolean(files.synhax_directory_handle));
</script>

<svelte:head>
	<title>Settings - Synhax</title>
</svelte:head>

<div class="battle-surface stack" style="--gap: var(--space-l);">
	<h1>Settings</h1>

	<section class="layout-card stack" style="--gap: var(--space-s);">
		<h2>File System</h2>
		<div class="stack" style="--gap: 0.35rem;">
			<span class="muted">Current folder</span>
			<div class="cluster" style="align-items: center;">
				<strong>{current_folder}</strong>
				{#if has_folder}
					<span class="tag">Connected</span>
				{/if}
			</div>
		</div>
		<div class="cluster">
			<button class="button" onclick={() => files.restore_directory_handle()}>
				Reconnect
			</button>
			<button class="go_button" onclick={() => files.setup_synhax_directory()}>
				Choose New Folder
			</button>
		</div>
	</section>

	<Logout />
</div>
