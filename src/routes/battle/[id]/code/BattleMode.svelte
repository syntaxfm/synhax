<!-- BATTLE MODE -->
<!-- 1. Select Project Dir -->
<!-- 2. Choose battle -->
<!-- 2.1 Available Battles To Select -->
<!-- 2.2 Change Project Dir -->
<!-- 3. Battle View -->
<!-- 3.1 HTML & CSS File Showing the one edited last or clicked on  -->
<!-- 3.2 iFrame of output -->
<!-- 3.3 iFrame could be broken out into it's own window -->
<!-- 3.4 Timer -->
<script lang="ts">
	import Highlight from 'svelte-highlight';
	import css from 'svelte-highlight/languages/css';
	import xml from 'svelte-highlight/languages/xml';
	import horizonDark from 'svelte-highlight/styles/horizon-dark';
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import Debug from '$lib/Debug.svelte';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import type { Battle, Hax } from '$sync/schema';

	let { battle, hax }: { battle: Battle; hax: Hax } = $props();
</script>

<section class="battle-mode">
	<Splitpanes>
		<Pane>
			<Splitpanes horizontal={true}>
				<Pane minSize={15}>
					<article class="stack">
						<h2>HTML</h2>
						<Highlight language={xml} code={hax.html || ''} />
					</article>
				</Pane>
				<Pane>
					<article class="stack">
						<h2>CSS</h2>
						<Highlight language={css} code={hax.css || ''} />
					</article>
				</Pane>
			</Splitpanes>
		</Pane>
		<Pane minSize={20}>
			<Splitpanes horizontal={true}>
				<Pane minSize={15}>
					<div class="output stack">
						<h2>Target</h2>
						<img src={battle?.target?.image} alt="Battle Image" width="100%" />
					</div>
				</Pane>
				<Pane>
					<div class="output stack">
						<h2>App</h2>
						<AppFrame {hax} />
						<a target="_blank" href="/battle/{battle.id}/code/breakout"
							><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
								><title>launch</title><g
									fill="#000000"
									stroke-linejoin="miter"
									stroke-linecap="butt"
									><line
										x1="11"
										y1="13"
										x2="22"
										y2="2"
										fill="none"
										stroke="#000000"
										stroke-miterlimit="10"
										stroke-width="2"
									></line><polyline
										points="14 2 22 2 22 10"
										fill="none"
										stroke="#000000"
										stroke-linecap="square"
										stroke-miterlimit="10"
										stroke-width="2"
									></polyline><path
										d="M9,4H4A2,2,0,0,0,2,6V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V15"
										fill="none"
										stroke="#000000"
										stroke-linecap="square"
										stroke-miterlimit="10"
										stroke-width="2"
									></path></g
								></svg
							></a
						>
					</div>
				</Pane>
			</Splitpanes>
		</Pane>
	</Splitpanes>

	<Debug />
</section>

<style>
	.battle-mode {
		display: grid;
		height: 100vh;
		grid-template-rows: minmax(0, 1fr) auto;
	}

	h2 {
		font-size: 12px;
		text-transform: uppercase;
		background: #eee;
		border-bottom: var(--border);
		border-left: var(--border);
		border-right: var(--border);
		padding: 4px 10px 2px;
		color: #1c1e26;
	}

	article {
		background: #1c1e26;
		height: 100%;
	}
	:global(.splitpanes__splitter) {
		border-inline: var(--border);
	}
</style>
