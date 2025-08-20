<script lang="ts">
	import type { Hax } from '$sync/schema';
	import { combine_html_and_css } from '$utils/code';
	const { hax }: { hax: Hax } = $props();
	const code = $derived(combine_html_and_css(hax.html, hax.css));
</script>

<iframe srcdoc={code} title="App Frame"></iframe>

<style>
	iframe {
		width: 100%;
		height: 100%;
		border: none;
	}
</style>
