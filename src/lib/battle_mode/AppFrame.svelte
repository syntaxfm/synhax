<script lang="ts">
	import { combine_html_and_css } from '$utils/code';
	import { FRAME_HEIGHT, FRAME_WIDTH } from '$lib/constants';
	type HaxData = {
		html: string;
		css: string;
	};

	interface Props {
		hax: HaxData;
		iframeElement?: HTMLIFrameElement | null;
		/** Called when iframe finishes loading new content */
		onload?: () => void;
		/** When true, adds an overlay to prevent inspect element */
		disableInspect?: boolean;
	}

	let {
		hax,
		iframeElement = $bindable(null),
		onload,
		disableInspect = false
	}: Props = $props();
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

<div
	class="frame-container"
	class:disable-inspect={disableInspect}
	style:--frame-width="{FRAME_WIDTH}px"
	style:--frame-height="{FRAME_HEIGHT}px"
>
	<iframe
		bind:this={iframeElement}
		srcdoc={code}
		title="App Frame"
		onload={handleLoad}
		sandbox="allow-same-origin allow-scripts"
	></iframe>
</div>

<style>
	.frame-container {
		width: 100%;
		height: 100%;
		position: relative;
	}
	.frame-container.disable-inspect::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 10;
		/* Transparent overlay that blocks pointer events to iframe */
		pointer-events: auto;
	}

	iframe {
		width: var(--frame-width);
		height: var(--frame-height);
		border: none;
		padding: 0;
	}
</style>
