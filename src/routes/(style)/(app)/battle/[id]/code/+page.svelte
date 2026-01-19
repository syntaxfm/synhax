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
	import { goto } from '$app/navigation';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import { files } from '$lib/state/FileState.svelte';

	import Header from '$lib/battle_mode/Header.svelte';
	import Modal from '$lib/ui/Modal.svelte';

	let battle = $derived(
		z.createQuery(queries.battles.byIdSimple({ id: page?.params?.id || '' }))
	);

	let hax = $derived(
		z.createQuery(queries.hax.myForBattle({ battleId: battle?.data?.id || '' }))
	);

	// Get all participants with their user and hax data for the progress bars
	let battlers = $derived(
		(battle?.data?.participants ?? []).map((p) => ({
			id: p.id,
			user_id: p.user_id,
			user: p.user,
			hax: p.hax
		}))
	);

	// Modern Svelte 5 approach with runes
	let poll_timer: NodeJS.Timeout | null = $state(null);

	$effect(() => {
		if (battle.data?.id) {
			files.load_hax_directory(battle.data.id);
		}
	});

	// Auto-redirect to recap when battle completes
	$effect(() => {
		if (
			battle.data?.status === 'COMPLETED' &&
			(battle.data.win_condition === 'FIRST_TO_PERFECT' ||
				battle.data.allow_time_extension === false)
		) {
			goto(`/recap/${battle.data.id}`);
		}
	});

	$effect(() => {
		if (!battle.data?.id || !hax.data?.id || files.status !== 'ACCESS') {
			if (poll_timer) {
				clearInterval(poll_timer);
				poll_timer = null;
			}
			return;
		}

		// Start the polling interval
		poll_timer = setInterval(async () => {
			try {
				await files.read_and_apply_project_files(hax.data?.id, false, {
					battle_starts_at: battle.data?.starts_at ?? null,
					current_html: hax.data?.html ?? '',
					current_css: hax.data?.css ?? ''
				});
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
	<main class="stack battle-code-page" style="--gap: 0;">
		<Header
			battle={battle.data}
			target={false}
			diffScore={hax.data?.diff_score ?? null}
			{battlers}
		>
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
	</main>
{/if}

<Modal open={files.status !== 'ACCESS'} title="File Access">
	<p>Your file access needs to be restored after refresh</p>
	<button
		onclick={() => files.restore_directory_handle()}
		class="big_button go_button">Give Access</button
	>
</Modal>

<style>
	.battle-code-page {
		min-height: 100vh;
		height: 100vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.battle-code-page :global(.battle-mode) {
		flex: 1;
		min-height: 0;
	}
</style>
