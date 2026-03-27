<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import InviteUser from '$lib/battle_mode/InviteUser.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import { build_hax_folder_name, files } from '$lib/state/FileState.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import ToggleButton from '$lib/ui/ToggleButton.svelte';
	import { mutators, queries, z } from '$lib/zero.svelte';
	import { formatBattleStatus } from '$lib/constants';
	import Battlers from './Battlers.svelte';

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	const user = z.createQuery(queries.user.current());
	const is_admin = $derived(user.data?.role === 'syntax');
	const is_solo = $derived(battle.data?.type === 'SOLO');

	// Track countdown status for modal
	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');
	let custom_overtime_minutes = $state(5);

	const custom_overtime_valid = $derived.by(
		() =>
			Number.isInteger(custom_overtime_minutes) && custom_overtime_minutes >= 1
	);

	// Minimum participants required to start a battle (2 players per battle)
	const MIN_PARTICIPANTS: number = 2;

	// Count participants who are locked in (status === 'READY')
	let ready_count = $derived(
		battle.data?.participants?.filter((p) => p.status === 'READY').length ?? 0
	);

	// Battles require at least MIN_PARTICIPANTS locked in to start
	let can_start = $derived(ready_count >= MIN_PARTICIPANTS);

	let is_participant = $derived(
		battle.data?.participants?.some(
			(participant) => participant.user_id === z.userID
		) ?? false
	);

	let is_referee = $derived(
		battle.data?.referee_id === z.userID ||
			battle.data?.referee?.id === z.userID
	);

	// Count active participants (not dropped)
	let active_participants = $derived(
		battle.data?.participants?.filter((p) => p.status !== 'DROPPED') ?? []
	);

	let folder_name = $derived.by(() => {
		if (!battle.data?.id) return null;
		return build_hax_folder_name({
			id: battle.data.id,
			name: battle.data.name ?? battle.data.target?.name ?? null
		});
	});

	const my_solo_hax = $derived.by(() => {
		if (!is_solo) return null;
		const participant = battle.data?.participants?.find(
			(candidate) => candidate.user_id === z.userID
		);
		return participant?.hax ?? null;
	});

	let soloStarting = $state(false);
	let soloLockingIn = $state(false);
	let soloPreparingFiles = $state(false);
	let soloFilesReady = $state(false);
	let soloFileError = $state('');
	let soloStartError = $state('');
	let modeSwitching = $state(false);
	let battleModeError = $state('');

	const can_switch_to_solo = $derived(active_participants.length <= 1);

	$effect(() => {
		if (!battle.data) return;
		if (
			!is_solo &&
			is_referee &&
			battle.data.type === 'TIME_TRIAL' &&
			['PENDING', 'READY'].includes(battle.data.status ?? '')
		) {
			z.mutate(
				mutators.battles.update({
					id: battle.data.id,
					type: 'TIMED_MATCH'
				})
			);
		}
		if (
			is_referee &&
			['PENDING', 'READY'].includes(battle.data.status ?? '') &&
			battle.data.win_condition !== 'FIRST_TO_PERFECT'
		) {
			z.mutate(
				mutators.battles.update({
					id: battle.data.id,
					win_condition: 'FIRST_TO_PERFECT'
				})
			);
		}
		if (battle.data.status === 'ACTIVE' && is_solo && is_participant) {
			goto(`/battle/${battle.data.id}/code`);
			return;
		}
		// ACTIVE state: redirect Referee to referee view
		if (battle.data.status === 'ACTIVE' && is_referee && !is_solo) {
			goto(`/ref/${battle.data.id}`);
			return;
		}

		// ACTIVE or READY state: redirect Participants to battle view
		if (
			['ACTIVE', 'READY'].includes(battle.data.status ?? '') &&
			is_participant &&
			!is_referee
		) {
			goto(`/battle/${battle.data.id}/code`);
			return;
		}
		if (
			battle.data.status === 'COMPLETED' &&
			battle.data.win_condition === 'FIRST_TO_PERFECT'
		) {
			goto(`/recap/${battle.data.id}`);
		}
	});

	async function finish_solo_battle() {
		if (!battle.data || !is_referee || !is_solo) return;
		const mutation = z.mutate(
			mutators.battles.finish_solo({
				id: battle.data.id
			})
		);
		try {
			await mutation.server;
		} catch (error) {
			console.error('Failed to finish solo battle:', error);
		}
	}

	async function toggle_privacy() {
		if (!battle.data || !is_referee) return;
		const new_visibility =
			battle.data.visibility === 'PUBLIC' ? 'PRIVATE' : 'PUBLIC';
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				visibility: new_visibility
			})
		);
	}

	function update_time_limit(event: Event) {
		if (!battle.data || !is_referee || is_solo) return;
		const input = event.target as HTMLInputElement;
		const new_time = parseFloat(input.value);
		if (!isNaN(new_time)) {
			z.mutate(
				mutators.battles.update({
					id: battle.data.id,
					total_time_seconds: new_time * 60
				})
			);
		}
	}

	function toggle_time_extension() {
		if (!battle.data || !is_referee) return;
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				allow_time_extension: !battle.data.allow_time_extension
			})
		);
	}

	function update_battle_name(event: Event) {
		if (!battle.data || !is_referee) return;
		const input = event.target as HTMLInputElement;
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				name: input.value || undefined
			})
		);
	}

	/**
	 * Lock in the battle - transitions from PENDING to READY
	 * Players will be redirected to the code screen to prepare
	 */
	async function lock_in() {
		if (!battle.data || !is_referee) return;
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				status: 'READY' as const
			})
		);
	}

	async function start() {
		if (!battle.data || !is_referee) {
			console.error('You are not authorized to start this battle');
			return;
		}
		// Can only start from READY state
		if (battle.data.status !== 'READY') return;

		const now = Date.now();
		const updates: any = {
			id: page.params.id,
			status: 'ACTIVE' as const,
			starts_at: now,
			type: 'TIMED_MATCH' as const,
			win_condition: 'FIRST_TO_PERFECT' as const
		};

		// Default to 10 minutes (600 seconds) if total_time_seconds not set
		const time_seconds = battle.data.total_time_seconds || 600;
		updates.total_time_seconds = time_seconds;
		updates.ends_at = now + time_seconds * 1000;

		z.mutate(mutators.battles.update(updates));

		// Redirect battlers to the battle code view
		goto(`/battle/${page.params.id}/code`);
	}

	async function start_solo() {
		if (!battle.data || !is_referee || !is_solo || soloStarting) return;
		// Can only start from READY state (no FS prompts here)
		if (battle.data.status !== 'READY') {
			soloStartError = 'Lock in first to start the battle.';
			return;
		}
		if (!soloFilesReady) {
			soloStartError =
				'Solo files are not prepared. Please re-prepare your local battle files and try again.';
			console.error(
				'[start_solo] soloFilesReady is false; user must re-prepare files'
			);
			return;
		}
		soloStarting = true;
		soloStartError = '';
		soloFileError = '';

		if (!folder_name || !my_solo_hax) {
			soloStartError = 'Battle files are not ready yet. Refresh and try again.';
			soloStarting = false;
			return;
		}

		const mutation = z.mutate(
			mutators.battles.start_solo({
				id: battle.data.id
			})
		);
		try {
			await mutation.server;
			goto(`/battle/${battle.data.id}/code`);
		} catch (error) {
			soloStartError = 'Could not start battle. Please try again.';
			console.error('Failed to start solo battle:', error);
		} finally {
			soloStarting = false;
		}
	}

	async function prepare_solo_files(): Promise<boolean> {
		if (
			soloPreparingFiles ||
			!battle.data ||
			!is_solo ||
			!(is_participant || is_referee)
		) {
			return false;
		}

		soloPreparingFiles = true;
		soloFileError = '';
		soloStartError = '';
		soloFilesReady = false;

		if (!folder_name || !my_solo_hax) {
			soloFileError = 'Battle files are not ready yet. Refresh and try again.';
			soloPreparingFiles = false;
			return false;
		}

		const hasAccess =
			files.status === 'ACCESS' && files.synhax_directory_handle
				? true
				: await files.restore_directory_handle();
		if (!hasAccess || !files.synhax_directory_handle) {
			soloFileError =
				'Connect a folder so Synhax can prepare your local battle files.';
			soloPreparingFiles = false;
			return false;
		}

		try {
			await files.create_hax_directory(
				folder_name,
				my_solo_hax.html ?? '',
				my_solo_hax.css ?? '',
				battle.data.id
			);
			await files.load_hax_directory(folder_name, battle.data.id);
			soloFilesReady = true;
			return true;
		} catch (error) {
			soloFileError = 'Unable to prepare your local battle files.';
			console.error('Failed to set up solo files:', error);
			return false;
		} finally {
			soloPreparingFiles = false;
		}
	}

	async function lock_in_solo() {
		if (!battle.data || !is_referee || !is_solo || soloLockingIn) return;
		soloLockingIn = true;
		soloStartError = '';
		soloFileError = '';
		try {
			if (!soloFilesReady) {
				const ok = await prepare_solo_files();
				if (!ok) return;
			}

			const mutation = z.mutate(
				mutators.battles.update({
					id: battle.data.id,
					status: 'READY' as const
				})
			);
			await mutation.server;
		} catch (error) {
			soloStartError = 'Could not lock in. Please try again.';
			console.error('Failed to lock in solo battle:', error);
		} finally {
			soloLockingIn = false;
		}
	}

	async function set_battle_mode(next_type: 'SOLO' | 'TIMED_MATCH') {
		if (
			!battle.data ||
			!is_referee ||
			battle.data.status !== 'PENDING' ||
			modeSwitching ||
			next_type === battle.data.type
		) {
			return;
		}

		if (next_type === 'SOLO' && !can_switch_to_solo) {
			battleModeError =
				'Two-player battles with invited participants cannot switch back to solo.';
			return;
		}

		modeSwitching = true;
		battleModeError = '';

		const mutation = z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				type: next_type,
				allow_time_extension: next_type === 'TIMED_MATCH',
				overtime_seconds: 0,
				win_condition: 'FIRST_TO_PERFECT'
			})
		);

		try {
			await mutation.server;
		} catch (error) {
			battleModeError = `Could not switch to ${next_type === 'SOLO' ? 'solo' : '2-player'} mode. Please try again.`;
			console.error('Failed to switch battle mode:', error);
		} finally {
			modeSwitching = false;
		}
	}

	async function add_overtime(minutes: number) {
		if (!battle.data || !is_referee) return;

		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				overtime_seconds: minutes * 60,
				ends_at: Date.now() + minutes * 60 * 1000
			})
		);
		over_status = 'ACTIVE';
	}

	function start_custom_overtime() {
		if (!custom_overtime_valid) return;
		add_overtime(custom_overtime_minutes);
	}

	function finish_battle() {
		if (!battle.data || !is_referee) return;

		// For FIRST_TO_PERFECT mode, determine winner by highest diff_score
		let winner_hax_id: string | null = null;
		if (battle.data.win_condition === 'FIRST_TO_PERFECT') {
			let highest_score = -1;
			for (const participant of battle.data.participants ?? []) {
				const hax = participant.hax;
				if (!hax) continue;
				const score = hax.diff_score ?? 0;
				if (score > highest_score) {
					highest_score = score;
					winner_hax_id = hax.id;
				}
			}
			console.log(
				`[finish_battle] FIRST_TO_PERFECT winner: ${winner_hax_id} with score ${highest_score}`
			);
		}

		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				status: 'COMPLETED',
				winner_hax_id
			})
		);
	}
</script>

<svelte:head>
	<title
		>{battle.data?.name || battle.data?.target?.name || 'Battle'} Lobby - Synhax</title
	>
</svelte:head>

{#if battle.data}
	{@const battleData = battle.data}
	<div class="layout-readable stack battle-surface">
		<h1 class="game-title">
			{battle.data.name || `${battle.data.target?.name} Battle`}
		</h1>

		<!-- Show countdown when battle is active -->
		{#if battle.data.status === 'ACTIVE' && battle.data.type === 'TIMED_MATCH'}
			<div class="cluster" style="justify-content: center;">
				<Countdown
					battle={battle.data}
					bind:status={over_status}
					view="REF"
					onautoend={is_solo ? finish_solo_battle : finish_battle}
				/>
			</div>
		{/if}

		<!-- Battle status indicator -->
		{#if battle.data.status !== 'PENDING'}
			<p class="cluster" style="justify-content: center;">
				<span class="status-text {battle.data.status?.toLowerCase()}">
					{formatBattleStatus(battle.data.status)}
				</span>
			</p>
		{/if}

		{#if folder_name}
			<div class="stack" style="align-items: center; --gap: 0.35rem;">
				<span class="muted">Battle folder name</span>
				<code>{folder_name}</code>
			</div>
		{/if}

		<!-- Settings only shown when PENDING -->
		{#if battle.data.status === 'PENDING' && is_referee}
			<section class="stack">
				<div class="cluster">
					<label for="battle-name">Battle Name:</label>
					<input
						id="battle-name"
						type="text"
						placeholder={`${battle.data.target?.name} Battle`}
						value={battle.data.name || ''}
						onchange={update_battle_name}
					/>
				</div>

				<div class="cluster">
					<span>Battle Mode:</span>
					<ToggleButton
						toggle={is_solo}
						on_text="Solo"
						off_text="Two Player"
						disabled={modeSwitching}
						ontoggle={() => set_battle_mode(is_solo ? 'TIMED_MATCH' : 'SOLO')}
					/>
					<span class="help-text">
						{is_solo
							? 'Complete the target on your own against a timer.'
							: 'Invite an opponent. Both players must be ready before the battle can start.'}
					</span>
				</div>
				{#if battleModeError}
					<p class="error-message">{battleModeError}</p>
				{/if}

				{#if !is_solo}
					<div class="cluster">
						<ToggleButton
							toggle={battle.data.visibility === 'PUBLIC'}
							ontoggle={toggle_privacy}
							on_text="Public"
							off_text="Private"
						/>
					</div>
				{/if}

				{#if is_solo}
					<div class="cluster">
						<span>Time Limit:</span>
						<strong>15 minutes</strong>
					</div>
					<div class="cluster">
						<label for="time-limit">Time Limit:</label>
						<input
							defaultValue={battle.data.total_time_seconds / 60 || 10}
							id="time-limit"
							type="number"
							placeholder="Enter time limit"
							required
							step="any"
							onchange={update_time_limit}
						/>
						<span>minutes</span>
					</div>
				{:else if battle.data?.type === 'TIMED_MATCH'}
					<div class="cluster">
						<label for="time-limit">Time Limit:</label>
						<input
							defaultValue={battle.data.total_time_seconds / 60 || 10}
							id="time-limit"
							type="number"
							placeholder="Enter time limit"
							required
							step="any"
							onchange={update_time_limit}
						/>
						<span>minutes</span>
					</div>
					<div class="cluster">
						<ToggleButton
							toggle={battle.data.allow_time_extension ?? true}
							ontoggle={toggle_time_extension}
							on_text="Allow Overtime"
							off_text="Auto-End"
						/>
						<span class="help-text">
							{(battle.data.allow_time_extension ?? true)
								? 'Host can extend time when battle ends'
								: 'Battle auto-ends and goes to recap'}
						</span>
					</div>
				{/if}
			</section>
		{/if}

		{#if !is_solo && (is_referee || is_admin)}
			<ShareLinks
				battle={battleData}
				lobby={true}
				battleCode={true}
				watch={false}
				ref={true}
				alwaysEnabled={true}
			/>
		{/if}

		{#if !is_solo}
			<Battlers battle={battleData} {is_referee} />
		{/if}

		<!-- Invite players (ref only, when PENDING and less than 2 participants) -->
		{#if !is_solo && battle.data?.status === 'PENDING' && is_referee && active_participants.length < 2}
			<section class="stack">
				<h2 class="game-title">Invite Player</h2>
				<InviteUser
					battle_id={battle.data.id}
					existing_user_ids={battle.data.participants?.map((p) => p.user_id) ??
						[]}
				/>
			</section>
		{/if}

		<!-- Lock In button when PENDING (ref only) -->
		{#if battle.data?.status === 'PENDING' && is_referee && is_solo}
			<div class="stack" style="align-items: center; --gap: 0.75rem;">
				<button
					class="go_button big_button"
					onclick={lock_in_solo}
					disabled={soloLockingIn ||
						soloPreparingFiles ||
						soloStarting ||
						!folder_name ||
						!my_solo_hax}
				>
					{soloLockingIn || soloPreparingFiles ? 'Locking In...' : 'Lock In'}
				</button>
				<p class="help-text" style="text-align: center;">
					Lock in to prepare your local battle files and move the battle to
					READY.
				</p>
				{#if files.status !== 'ACCESS'}
					<p class="help-text" style="text-align: center;">
						You'll be prompted to grant folder access.
					</p>
				{/if}
				{#if soloFileError}
					<p class="error-message">{soloFileError}</p>
				{/if}
				{#if soloStartError}
					<p class="error-message">{soloStartError}</p>
				{/if}
			</div>
		{:else if battle.data?.status === 'PENDING' && is_referee}
			<div class="cluster" style="justify-content: center;">
				<button
					class="go_button big_button"
					onclick={lock_in}
					disabled={!can_start}
				>
					Confirm Players
				</button>
			</div>
			{#if !can_start}
				<p class="muted" style="text-align: center;">
					Both players need to be ready before you can start ({ready_count}/{MIN_PARTICIPANTS}
					ready)
				</p>
			{/if}
		{:else if battle.data?.status === 'PENDING' && is_participant && !is_solo}
			<p class="waiting-message">Waiting for the host to start the battle...</p>
		{/if}

		<!-- READY state controls -->
		{#if battle.data?.status === 'READY' && is_solo}
			<div class="stack" style="align-items: center; --gap: 1rem;">
				{#if is_referee}
					{#if folder_name}
						<div class="solo-ready-callout">
							<p class="solo-ready-callout__title">Open your text editor now</p>
							<p class="solo-ready-callout__body">
								Open the <code>{folder_name}</code> folder before starting the battle.
								The clock will start immediately.
							</p>
						</div>
					{/if}
					<button
						class="go_button big_button"
						onclick={start_solo}
						disabled={soloStarting || !soloFilesReady}
					>
						{soloStarting ? 'Starting...' : 'Start Battle'}
					</button>
					<p class="muted" style="text-align: center;">
						You're locked in. Timer starts immediately.
					</p>
					<p class="help-text" style="text-align: center;">
						Starting the battle will not prompt for folder access.
					</p>
					{#if !soloFilesReady}
						<button
							class="button"
							onclick={prepare_solo_files}
							disabled={soloPreparingFiles ||
								soloStarting ||
								!folder_name ||
								!my_solo_hax}
						>
							{soloPreparingFiles ? 'Preparing Files...' : 'Re-prepare Files'}
						</button>
						<p class="help-text" style="text-align: center;">
							If you refreshed this page, use this to reload your local battle
							files.
						</p>
					{/if}
					{#if soloFileError}
						<p class="error-message">{soloFileError}</p>
					{/if}
					{#if soloStartError}
						<p class="error-message">{soloStartError}</p>
					{/if}
				{/if}
			</div>
		{:else if battle.data?.status === 'READY' && !is_solo}
			<div class="stack" style="align-items: center; --gap: 1rem;">
				{#if is_referee}
					<button class="go_button big_button" onclick={start}>
						Start the Battle
					</button>
					<p class="muted" style="text-align: center;">
						Everyone's ready. Click to start the countdown!
					</p>
				{/if}

				{#if is_participant}
					<a href={`/battle/${battle.data.id}/code`} class="button primary">
						You're in! Click here to enter the battle.
					</a>
				{/if}
			</div>
		{/if}

		<!-- Controls when ACTIVE -->
		{#if battle.data?.status === 'ACTIVE' && is_referee && !is_solo}
			<div class="cluster" style="justify-content: center; --gap: 1rem;">
				<a href={`/battle/${battle.data.id}/ref`} class="button">
					Enter Battle
				</a>
				<button class="go_button" onclick={finish_battle}>
					End Battle Early
				</button>
			</div>
		{/if}

		<!-- Link to recap when COMPLETED -->
		{#if battle.data?.status === 'COMPLETED'}
			<div class="cluster" style="justify-content: center;">
				<a href={`/recap/${battle.data.id}`} class="button primary">
					View Battle Recap
				</a>
			</div>
		{/if}
	</div>

	<!-- Time's up modal for TIMED_MATCH -->
	{#if battle.data?.type === 'TIMED_MATCH' && !is_solo}
		<Modal
			title="Time's Up!"
			open={battle.data.status === 'ACTIVE' && over_status === 'OVER'}
		>
			<div class="stack" style="align-items: center;">
				<button class="go_button big_button" onclick={finish_battle}>
					Finish Battle
				</button>

				<hr style="width: 100%;" />

				<div class="stack" style="align-items: center;">
					<p>Need more time?</p>
					<div class="cluster" style="--gap: 0.5rem;">
						<button onclick={() => add_overtime(5)}>+5 min</button>
						<button onclick={() => add_overtime(10)}>+10 min</button>
						<button onclick={() => add_overtime(15)}>+15 min</button>
					</div>
					<form
						class="cluster"
						style="--gap: 0.5rem;"
						onsubmit={(event) => {
							event.preventDefault();
							start_custom_overtime();
						}}
					>
						<input
							type="number"
							min="1"
							step="1"
							inputmode="numeric"
							aria-label="Custom overtime minutes"
							bind:value={custom_overtime_minutes}
						/>
						<button type="submit" disabled={!custom_overtime_valid}>
							+ Custom
						</button>
					</form>
				</div>
			</div>
		</Modal>
	{/if}
{:else}
	<div class="layout-readable stack battle-surface">
		<h2 class="game-title">Battle Not Found!</h2>
		<p>The battle you are looking for does not exist.</p>
		<p>
			If you believe this is an error, try refreshing or heading back to the
			dashboard.
		</p>
		<code>Battle ID: {page.params.id}</code>
	</div>
{/if}

<style>
	h1,
	h2 {
		margin: 0;
	}

	.muted {
		color: var(--fg-muted);
	}

	.waiting-message {
		text-align: center;
		padding: var(--pad-m) var(--pad-l);
		background: hsl(from var(--black) h s 8%);
		border-radius: var(--br-m);
		border: 1px solid rgb(255 255 255 / 0.1);
		color: var(--yellow);
		font-weight: 600;
	}

	.help-text {
		color: var(--fg-muted);
		font-size: var(--font-size-sm);
	}

	.solo-ready-callout {
		width: min(560px, 100%);
		padding: 0.9rem 1rem;
		border-radius: var(--br-m);
		border: 1px solid rgb(255 255 255 / 0.18);
		background: hsl(from var(--yellow) h s 12%);
		color: hsl(from var(--yellow) h s 75%);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
	}

	.solo-ready-callout__title {
		margin: 0;
		font-weight: 800;
		letter-spacing: 0.02em;
		font-size: 1.05rem;
	}

	.solo-ready-callout__body {
		margin: 0.35rem 0 0;
		font-size: 0.95rem;
		line-height: 1.35;
	}

	.error-message {
		margin: 0;
		color: var(--red);
		font-size: 0.85rem;
		text-align: center;
	}

	input[type='number'] {
		width: 80px;
	}

	input[type='text']#battle-name {
		flex: 1;
		min-width: 200px;
	}
</style>
