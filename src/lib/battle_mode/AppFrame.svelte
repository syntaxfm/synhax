<script lang="ts">
	import { combine_html_and_css } from '$utils/code';

	type HaxData = {
		html: string;
		css: string;
	};

	interface Props {
		hax: HaxData;
		iframeElement?: HTMLIFrameElement | null;
		/** Called when iframe finishes loading new content */
		onload?: () => void;
	}

	let { hax, iframeElement = $bindable(null), onload }: Props = $props();
	const code = $derived(combine_html_and_css(hax.html, hax.css));

	function handleLoad() {
		// Small delay to ensure paint is complete after DOM load
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				onload?.();
			});
		});
	}
</script>

<iframe
	bind:this={iframeElement}
	srcdoc={code}
	title="App Frame"
	onload={handleLoad}
	sandbox="allow-same-origin allow-scripts"
></iframe>

<style>
	iframe {
		width: 100%;
		height: 100%;
		border: none;
		padding: 0;
	}
</style>
