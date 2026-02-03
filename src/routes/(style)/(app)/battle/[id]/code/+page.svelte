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
	import { build_hax_folder_name, files } from '$lib/state/FileState.svelte';
	import { play_sound } from '$lib/ui/sounds';

	import Header from '$lib/battle_mode/Header.svelte';
	import Modal from '$lib/ui/Modal.svelte';

	// Air horn sound for battle start
	let airHorn: HTMLAudioElement;
	let previousStatus: string | null = $state(null);

	let battle = $derived(
		z.createQuery(queries.battles.byIdSimple({ id: page?.params?.id || '' }))
	);

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

	let poll_timer: NodeJS.Timeout | null = $state(null);

	$effect(() => {
		if (battle.data?.id && folder_name) {
			files.load_hax_directory(folder_name, battle.data.id);
		}
	});

	// Play air horn when battle starts (READY -> ACTIVE)
	$effect(() => {
		const currentStatus = battle.data?.status;
		if (previousStatus === 'READY' && currentStatus === 'ACTIVE') {
			if (airHorn) {
				play_sound(airHorn);
			}
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

<svelte:head>
	<title>{battle.data?.target?.name ?? 'Battle'} - Synhax</title>
</svelte:head>

<!-- Air horn for battle start -->
<audio bind:this={airHorn} src="/air-horn.mp3" preload="auto"></audio>

{#if battle.data}
	<main class="stack battle-code-page" style="--stack-gap: 0;">
		<Header
			battle={battle.data}
			target={false}
			diffScore={hax.data?.diff_score ?? null}
			{battlers}
			currentUserId={z.userID}
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
</style>
