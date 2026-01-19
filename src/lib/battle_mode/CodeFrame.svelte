<script lang="ts">
	import Highlight from 'svelte-highlight';
	import css from 'svelte-highlight/languages/css';
	import xml from 'svelte-highlight/languages/xml';
	const { html_text, css_text }: { html_text: string; css_text: string } =
		$props();
</script>

<article class="stack">
	<h2>HTML</h2>
	<div class="wrap">
		<Highlight language={xml} code={html_text} />
	</div>
</article>

<article class="stack">
	<h2>CSS</h2>
	<div class="wrap">
		<Highlight language={css} code={css_text} />
	</div>
</article>

<style>
	h2 {
		margin: 0;
		font-size: 12px;
		text-transform: uppercase;
		border-top: 1px solid hsl(from var(--black) h s 2%);
		border-bottom: 1px solid hsl(from var(--black) h s 2%);
		background: hsl(from var(--black) h s 2%);
		padding: 4px 10px 2px;
		color: var(--fg);
	}
	.stack {
		--stack-gap: 0;
	}
	.wrap {
		padding: 10px;
	}
</style>
