<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	$effect(() => {
		if (page.params.id) {
			goto(`/recap/${page.params.id}`);
		}
	});
</script>

<p>Redirecting to recap...</p>
