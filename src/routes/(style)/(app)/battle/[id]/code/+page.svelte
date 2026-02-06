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
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import { build_hax_folder_name, files } from '$lib/state/FileState.svelte';
	import { jukebox } from '$lib/media/jukebox';

	import Header from '$lib/battle_mode/Header.svelte';
	import Modal from '$lib/ui/Modal.svelte';

	// Preload sounds on mount
	$effect(() => {
		jukebox.preload();
	});

	let previousStatus: string | null = null;

	let battle = $derived(
		z.createQuery(queries.battles.byIdSimple({ id: page?.params?.id || '' }))
	);

	const isPaused = $derived(Boolean(battle.data?.paused_at));
	const isSoloBattle = $derived(battle.data?.type === 'SOLO');

	let hax = $derived(
		z.createQuery(queries.hax.myForBattle({ battleId: battle?.data?.id || '' }))
	);

	// Get all participants with their user and hax data for the progress bars
	let battlers = $derived.by(() => {
		const participants = battle.data?.participants ?? [];
		const sorted = [...participants]
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2);

		return sorted.map((participant, index) => {
			const displayOrder = participant.display_order ?? index;
			const color = displayOrder === 0 ? 'var(--blue)' : 'var(--red)';
			return {
				id: participant.id,
				user_id: participant.user_id,
				display_order: participant.display_order ?? null,
				color,
				user: participant.user,
				hax: participant.hax
			};
		});
	});

	// Modern Svelte 5 approach with runes
	let folder_name = $derived.by(() => {
		if (!battle.data?.id) return null;
		return build_hax_folder_name({
			id: battle.data.id,
			name: battle.data.name ?? battle.data.target?.name ?? null
		});
	});

	let poll_timer: NodeJS.Timeout | null = null;
	let soloFinishing = $state(false);

	$effect(() => {
		if (battle.data?.id && folder_name) {
			files.load_hax_directory(folder_name, battle.data.id);
		}
	});

	// Play air horn when battle starts (READY -> ACTIVE)
	$effect(() => {
		const currentStatus = battle.data?.status;
		if (previousStatus === 'READY' && currentStatus === 'ACTIVE') {
			jukebox.play('air-horn');
		}
		previousStatus = currentStatus ?? null;
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
		if (
			!battle.data?.id ||
			!hax.data?.id ||
			files.status !== 'ACCESS' ||
			isPaused
		) {
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

	async function finishSoloIfNeeded() {
		if (
			!battle.data?.id ||
			!isSoloBattle ||
			battle.data.status !== 'ACTIVE' ||
			soloFinishing
		) {
			return;
		}
		soloFinishing = true;
		const mutation = z.mutate(
			mutators.battles.finish_solo({ id: battle.data.id })
		);
		try {
			await mutation.server;
		} catch (error) {
			console.error('Failed to finish solo battle:', error);
		} finally {
			soloFinishing = false;
		}
	}

	$effect(() => {
		if (
			isSoloBattle &&
			battle.data?.status === 'ACTIVE' &&
			(hax.data?.diff_score ?? 0) >= 100
		) {
			finishSoloIfNeeded();
		}
	});
</script>

<svelte:head>
	<title>{battle.data?.target?.name ?? 'Battle'} - Synhax</title>
</svelte:head>

{#if battle.data}
	{@const battleData = battle.data}
	<main class="stack battle-code-page" style="--stack-gap: 0;">
		<Header
			battle={battleData}
			target={false}
			diffScore={hax.data?.diff_score ?? null}
			{battlers}
			currentUserId={z.userID}
		>
			{#snippet detail()}{/snippet}
			{#snippet countdown()}
				{#if battleData.type === 'TIMED_MATCH' || isSoloBattle}
					<Countdown
						battle={battleData}
						view="CODE"
						onautoend={isSoloBattle ? finishSoloIfNeeded : undefined}
					/>
				{/if}
			{/snippet}
		</Header>

		{#if hax.data}
			<BattleMode battle={battleData} hax={hax.data} />
		{/if}
	</main>

	{#if isPaused}
		<div class="paused-overlay">
			<div class="layout-card stack paused-card" style="--gap: 0.75rem;">
				<h2>Battle Paused</h2>
				<p>The referee has paused the battle.</p>
			</div>
		</div>
	{/if}
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
		/* min-height: 100vh; */
		--inline-gap: 1px;
		width: calc(1200px + var(--inline-gap));
		max-height: 960px;
		margin: 0 auto;
		/* height: 100vh; */
		display: flex;
		flex-direction: column;
		overflow: visible;
		background: var(--black);
	}

	.battle-code-page :global(.battle-mode) {
		flex: 1;
		min-height: 0;
		gap: 0 var(--inline-gap);
	}

	.paused-overlay {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 0.65);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 50;
	}

	.paused-card {
		width: min(90vw, 480px);
		text-align: center;
	}
</style>
