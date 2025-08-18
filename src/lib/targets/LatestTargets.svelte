<script lang="ts">
	import TargetListing from '$lib/targets/TargetListing.svelte';
</script>

<section>
	<h3>Latest Targets</h3>
	<TargetListing limit={10} />
</section>
