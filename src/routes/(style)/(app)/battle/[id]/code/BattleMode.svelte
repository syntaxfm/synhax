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
					<article class="stack code">
						<h2>HTML</h2>
						<div class="wrap">
							<Highlight language={xml} code={hax.html || ''} />
						</div>
					</article>
				</Pane>
				<Pane>
					<article class="stack code">
						<h2>CSS</h2>
						<div class="wrap">
							<Highlight language={css} code={hax.css || ''} />
						</div>
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
					<div class="output stack code-output">
						<h2>
							App
							<a target="_blank" href="/battle/{battle.id}/code/breakout"
								><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
									><title>launch</title><g fill="#fff" stroke-linejoin="miter" stroke-linecap="butt"
										><line
											x1="11"
											y1="13"
											x2="22"
											y2="2"
											fill="none"
											stroke="#fff"
											stroke-miterlimit="10"
											stroke-width="2"
										></line><polyline
											points="14 2 22 2 22 10"
											fill="none"
											stroke="#fff"
											stroke-linecap="square"
											stroke-miterlimit="10"
											stroke-width="2"
										></polyline><path
											d="M9,4H4A2,2,0,0,0,2,6V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V15"
											fill="none"
											stroke="#fff"
											stroke-linecap="square"
											stroke-miterlimit="10"
											stroke-width="2"
										></path></g
									></svg
								></a
							>
						</h2>
						<AppFrame {hax} />
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
		margin: 0;
		font-size: 12px;
		text-transform: uppercase;
		border-top: 1px solid hsl(from var(--black) h s 2%);
		border-bottom: 1px solid hsl(from var(--black) h s 2%);
		background: hsl(from var(--black) h s 2%);
		padding: 4px 10px 2px;
		color: var(--white);
		display: flex;
		justify-content: space-between;
		width: 100%;
	}

	article {
		background: #1c1e26;
		height: 100%;
	}
	:global(.splitpanes__splitter) {
		border-inline: var(--border);
	}
	.output {
		height: 100%;
		img {
			max-height: 100%;
			width: auto;
		}
	}
	.code-output {
		height: 100%;
	}
	.stack {
		align-items: center;
		&.code {
			align-items: start;
		}
	}
	.wrap {
		padding: 10px;
	}
</style>
