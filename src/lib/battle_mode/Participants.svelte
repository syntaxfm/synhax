<script lang="ts">
	import type { Participants } from '$sync/schema';
	const {
		locked_in_participants,
		participants
	}: {
		locked_in_participants: readonly Participants[];
		participants: readonly Participants[];
	} = $props();
</script>

<div>
	<p>
		{locked_in_participants?.length} / {participants.length} Participants Locked In
	</p>
</div>
