<script lang="ts">
	import { get_github_avatar_url } from '$lib/user/utils';
	import { mutators, queries, z } from '$lib/zero.svelte';

	const { children } = $props();

	const user = z.createQuery(queries.user.current());
	const github_avatar = $derived(get_github_avatar_url(user.data));

	$effect(() => {
		if (!user.data || !github_avatar) return;
		if (user.data.avatar === github_avatar) return;
		z.mutate(
			mutators.user.update({
				id: user.data.id,
				avatar: github_avatar
			})
		);
	});
</script>

{@render children()}
