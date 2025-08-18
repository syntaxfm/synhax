<script lang="ts">
	import type { Target } from '$sync/schema';

	const { target }: { target: Target } = $props();
</script>

<div>
	<h2>{target.name}</h2>
	<img src={target.inspo} alt={target.name} />
</div>
