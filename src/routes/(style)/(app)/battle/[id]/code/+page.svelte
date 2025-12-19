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
	import BattleMode from './BattleMode.svelte';
	import { z, queries } from '$lib/zero.svelte';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import { files } from '$lib/state/FileState.svelte';
	import { to_snake_case } from '$lib/user/utils';
	import Header from '$lib/battle_mode/Header.svelte';
	import Modal from '$lib/ui/Modal.svelte';

	let battle = $derived(
		z.createQuery(queries.battles.byIdSimple({ id: page?.params?.id || '' }))
	);

	let hax = $derived(
		z.createQuery(queries.hax.myForBattle({ battleId: battle?.data?.id || '' }))
	);

	// Modern Svelte 5 approach with runes
	let poll_timer: NodeJS.Timeout | null = $state(null);

	$effect(() => {
		if (battle.data?.target?.name) {
			files.load_hax_directory(to_snake_case(battle.data?.target.name));
		}
	});

	$effect(() => {
		// Start the polling interval
		poll_timer = setInterval(async () => {
			try {
				await files.read_and_apply_project_files(hax.data?.id, false);
			} catch (error) {
				console.error('Error reading project files:', error);
			}
		}, 400);

		// Cleanup function - runs when component unmounts
		return () => {
			if (poll_timer) {
				clearInterval(poll_timer);
				poll_timer = null;
			}
		};
	});
</script>

{#if battle.data}
	<Header battle={battle.data} target={false}>
		{#snippet detail()}{/snippet}
		{#snippet countdown()}
			{#if battle.data?.type === 'TIMED_MATCH'}
				<Countdown battle={battle.data} view="CODE" />
			{/if}
		{/snippet}
	</Header>

	{#if hax.data && battle.data}
		<BattleMode battle={battle.data} hax={hax.data} />
	{/if}
{/if}

<Modal open={files.status !== 'ACCESS'} title="File Access">
	<p>Your file access needs to be restored after refresh</p>
	<button
		onclick={() => files.restore_directory_handle()}
		class="big_button go_button">Give Access</button
	>
</Modal>
