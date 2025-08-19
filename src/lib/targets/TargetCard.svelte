<script lang="ts">
	import NewBattleButton from '$lib/battle_mode/NewBattleButton.svelte';
	import { type Target } from '$sync/schema';

	const { target }: { target: Target } = $props();
</script>

<article>
	<h2>{target.name}</h2>
	<img src={target.inspo} alt={target.name} style="max-width: 200px;" />
	<NewBattleButton target_id={target.id} />
</article>

<!-- TODO show stats -->
<!-- TODO give button to start battle -->
