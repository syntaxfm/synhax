<script lang="ts">
	import { files } from '$lib/state/FileState.svelte';

	const { text = 'Request Filesystem Access' }: { text?: string } = $props();
</script>

<button onclick={() => files.setup_synhax_directory()}>{text}</button>
