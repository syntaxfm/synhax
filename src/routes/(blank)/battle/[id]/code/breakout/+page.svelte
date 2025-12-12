<!-- How does this change with logins? -->

<!-- Logged Out View -->

<!-- Logged in view -->
<!-- Battle -->
<!-- SEE BATTLE MODE ^^ -->
<!--SEE PRODUCER MODE ^^ -->

<!-- Profile -->
<!-- Download all battles -->

<!-- PRODUCER MODE -->
<!-- Watch Battle -->
<!-- Create Battle -->

<!-- Difference between battle and target? -->
<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import { page } from '$app/state';
	import { combine_html_and_css } from '$utils/code';

	let battle = z.createQuery(
		z.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);

	let hax = $derived.by(() =>
		z.createQuery(
			z.query.hax
				.where(({ cmp, and }) =>
					and(
						cmp('battle_id', battle?.data?.id || ''),
						cmp('user_id', z.userID)
					)
				)
				.one()
		)
	);

	const code = $derived(
		combine_html_and_css(hax?.data?.html, hax?.data?.css)
	);
</script>

{@html code}

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
