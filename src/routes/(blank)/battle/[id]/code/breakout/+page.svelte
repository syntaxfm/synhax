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
	import { z, queries } from '$lib/zero.svelte';
	import { page } from '$app/state';
	import { combine_html_and_css } from '$utils/code';

	let battle = $derived(
		z.createQuery(queries.battles.byIdSimple({ id: page?.params?.id || '' }))
	);

	let hax = $derived.by(() =>
		z.createQuery(queries.hax.myForBattle({ battleId: battle?.data?.id || '' }))
	);

	const code = $derived(combine_html_and_css(hax?.data?.html, hax?.data?.css));
</script>

{@html code}

<style>
	:global(html, body) {
		margin: 0;
		padding: 0;
	}
</style>
