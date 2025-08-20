<script lang="ts">
	import Highlight from 'svelte-highlight';
	import css from 'svelte-highlight/languages/css';
	import xml from 'svelte-highlight/languages/xml';
	const { html_text, css_text }: { html_text: string; css_text: string } = $props();
</script>

<article class="stack">
	<h2>HTML</h2>
	<Highlight language={xml} code={html_text} />
</article>

<article class="stack">
	<h2>CSS</h2>
	<Highlight language={css} code={css_text} />
</article>
