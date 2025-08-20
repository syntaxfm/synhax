<script lang="ts">
	import { files } from './state/FileState.svelte';
</script>

<section>
	<span class="status {files.status}">
		Status: {files.status}
	</span>
	<span>Dir: {files.synhax_directory_handle?.name}</span>
	<span class="error">{files.error}</span>
</section>

<style>
	section {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		padding: 0.5rem;
		font-size: 0.7rem;
		border-top: var(--border);
	}

	.status {
		color: blue;
	}

	.ERROR {
		color: red;
		overflow: scroll;
	}
</style>
