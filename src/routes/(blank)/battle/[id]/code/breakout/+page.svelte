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
	import { Query } from 'zero-svelte';

	import { get_z } from '$lib/z';
	import { page } from '$app/state';
	import { combine_html_and_css } from '$utils/code';

	const z = get_z();

	let battle = new Query(
		z.query.battles
			.where('id', page?.params?.id || '')
			.one()
			.related('referee')
			.related('participants', (q) => q.related('user'))
			.related('target')
	);

	let hax = $derived.by(
		() =>
			new Query(
				z.query.hax
					.where(({ cmp, and }) =>
						and(
							cmp('battle_id', battle?.current?.id || ''),
							cmp('user_id', z.userID)
						)
					)
					.one()
			)
	);

	const code = $derived(
		combine_html_and_css(hax?.current?.html, hax?.current?.css)
	);
</script>

{@html code}
