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
	import AppFrame from '$lib/AppFrame.svelte';
	import Toolbar from '$lib/battle_mode/Toolbar.svelte';
	import Debug from '$lib/Debug.svelte';
	import { UserState } from '$lib/state/UserState.svelte';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import type { Battle } from '$sync/schema';

	let size = $state(20);

	let { battle }: { battle: Battle } = $props();

	const user = new UserState();
	$effect(() => {
		user.setup_user();
	});
</script>

<svelte:head>
	{@html horizonDark}
</svelte:head>

<section class="battle-mode">
	<Toolbar {user} />

	<Splitpanes>
		<Pane>
			<Splitpanes horizontal={true}>
				<Pane minSize={15}>
					<article class="stack">
						<h2>HTML</h2>
						<Highlight language={xml} code={user.active_project?.html.text || ''} />
					</article>
				</Pane>
				<Pane>
					<article class="stack">
						<h2>CSS</h2>
						<Highlight language={css} code={user.active_project?.css.text || ''} />
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
						<AppFrame {user} />
					</div>
				</Pane>
			</Splitpanes>
		</Pane>
	</Splitpanes>

	<Debug {user} />
</section>

<style>
	.battle-mode {
		display: grid;
		height: 100vh;
		grid-template-rows: auto minmax(0, 1fr) auto;
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
