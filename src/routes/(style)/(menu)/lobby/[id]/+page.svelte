<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import InviteUser from '$lib/battle_mode/InviteUser.svelte';
	import ShareLinks from '$lib/battle_mode/ShareLinks.svelte';
	import Modal from '$lib/ui/Modal.svelte';
	import ToggleButton from '$lib/ui/ToggleButton.svelte';
	import { mutators, queries, z } from '$lib/zero.svelte';
	import Battlers from './Battlers.svelte';

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	const user = z.createQuery(queries.user.current());
	const is_admin = $derived(user.data?.role === 'syntax');

	// Track countdown status for modal
	let over_status: 'ACTIVE' | 'OVER' = $state('ACTIVE');

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

	$effect(() => {
		if (!battle.data) return;
		// ACTIVE state: redirect everyone to their respective views
		if (battle.data.status === 'ACTIVE') {
			if (is_referee) {
				goto(`/ref/${battle.data.id}`);
				return;
			}
			if (is_participant) {
				goto(`/battle/${battle.data.id}/code`);
				return;
			}
		}
		if (
			battle.data.status === 'COMPLETED' &&
			battle.data.win_condition === 'FIRST_TO_PERFECT'
		) {
			goto(`/recap/${battle.data.id}`);
		}
	});

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

	async function toggle_type() {
		if (!battle.data || !is_referee) return;
		const new_type =
			battle.data.type === 'TIME_TRIAL' ? 'TIMED_MATCH' : 'TIME_TRIAL';
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				type: new_type
			})
		);
	}

	function update_time_limit(event: Event) {
		if (!battle.data || !is_referee) return;
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

	function toggle_win_condition() {
		if (!battle.data || !is_referee) return;
		const new_condition =
			battle.data.win_condition === 'FIRST_TO_PERFECT'
				? 'VOTING'
				: 'FIRST_TO_PERFECT';
		z.mutate(
			mutators.battles.update({
				id: battle.data.id,
				win_condition: new_condition
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
			toast.error('You are not authorized to start this battle');
			return;
		}
		// Can only start from READY state
		if (battle.data.status !== 'READY') return;

		const now = Date.now();
		const updates: any = {
			id: page.params.id,
			status: 'ACTIVE' as const,
			starts_at: now
		};

		// Set ends_at based on battle type
		if (battle.data.type === 'TIME_TRIAL') {
			updates.ends_at = null;
		} else if (battle.data.type === 'TIMED_MATCH') {
			// Default to 10 minutes (600 seconds) if total_time_seconds not set
			const time_seconds = battle.data.total_time_seconds || 600;
			updates.total_time_seconds = time_seconds;
			updates.ends_at = now + time_seconds * 1000;
		}

		z.mutate(mutators.battles.update(updates));

		// Redirect battlers to the battle code view
		goto(`/battle/${page.params.id}/code`);
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
	<title>{battle.data?.target?.name ?? 'Battle'} Lobby - Synhax</title>
</svelte:head>

{#if battle.data}
	{@const battleData = battle.data}
	<div class="layout-readable stack battle-surface">
		<h1 class="game-title">{battle?.data?.target?.name} Battle</h1>

		<!-- Show countdown when battle is active -->
		{#if battle.data.status === 'ACTIVE' && battle.data.type === 'TIMED_MATCH'}
			<div class="cluster" style="justify-content: center;">
				<Countdown
					battle={battle.data}
					bind:status={over_status}
					view="REF"
					onautoend={finish_battle}
				/>
			</div>
		{/if}

		<!-- Battle status indicator -->
		{#if battle.data.status !== 'PENDING'}
			<p class="cluster" style="justify-content: center; t">
				<span class="status-text {battle.data.status?.toLowerCase()}">
					{battle.data.status}
				</span>
			</p>
		{/if}

		<!-- Settings only shown when PENDING -->
		{#if battle.data.status === 'PENDING' && is_referee}
			<section class="stack">
				<div class="cluster">
					<ToggleButton
						toggle={battle.data.visibility === 'PUBLIC'}
						ontoggle={toggle_privacy}
						on_text="Public"
						off_text="Private"
					/>

					<ToggleButton
						disabled={['ACTIVE', 'COMPLETED'].includes(
							battle.data?.status ?? ''
						)}
						toggle={battle.data.type === 'TIME_TRIAL'}
						ontoggle={toggle_type}
						on_text="Time Trial"
						off_text="Timed Match"
					/>
				</div>

				{#if battle.data?.type === 'TIMED_MATCH'}
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
								? 'Referee can extend time when battle ends'
								: 'Battle auto-ends and goes to recap'}
						</span>
					</div>

					<div class="cluster">
						<ToggleButton
							toggle={battle.data.win_condition === 'FIRST_TO_PERFECT'}
							ontoggle={toggle_win_condition}
							on_text="Race to 100%"
							off_text="Voting"
						/>
						<span class="help-text">
							{battle.data.win_condition === 'FIRST_TO_PERFECT'
								? 'First to 100% accuracy wins instantly'
								: 'Winner decided by voting after battle'}
						</span>
					</div>
				{/if}
			</section>
		{/if}

		{#if is_referee || is_admin}
			<ShareLinks
				battle={battleData}
				lobby={true}
				battleCode={true}
				watch={false}
				ref={true}
				alwaysEnabled={true}
			/>
		{/if}

		<Battlers battle={battleData} {is_referee} />

		<!-- Invite players (ref only, when PENDING and less than 2 participants) -->
		{#if battle.data?.status === 'PENDING' && is_referee && active_participants.length < 2}
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
		{#if battle.data?.status === 'PENDING' && is_referee}
			<div class="cluster" style="justify-content: center;">
				<button
					class="go_button big_button"
					onclick={lock_in}
					disabled={!can_start}
				>
					Lock In Players
				</button>
			</div>
			{#if !can_start}
				<p class="muted" style="text-align: center;">
					Need at least {MIN_PARTICIPANTS} battler{MIN_PARTICIPANTS === 1
						? ''
						: 's'} ready to lock in ({ready_count}/{MIN_PARTICIPANTS})
				</p>
			{/if}
		{:else if battle.data?.status === 'PENDING' && is_participant}
			<p class="waiting-message">Waiting for referee to lock in players...</p>
		{/if}

		<!-- READY state controls -->
		{#if battle.data?.status === 'READY'}
			<div class="stack" style="align-items: center; --gap: 1rem;">
				{#if is_referee}
					<button class="go_button big_button" onclick={start}>
						Start Battle
					</button>
					<p class="muted" style="text-align: center;">
						Players are preparing. Click to start the clock!
					</p>
				{/if}

				{#if is_participant}
					<a href={`/battle/${battle.data.id}/code`} class="button primary">
						Battle Ready! Please click to enter the battle →
					</a>
				{/if}
			</div>
		{/if}

		<!-- Controls when ACTIVE -->
		{#if battle.data?.status === 'ACTIVE' && is_referee}
			<div class="cluster" style="justify-content: center; --gap: 1rem;">
				<a href={`/battle/${battle.data.id}/ref`} class="button">
					View Battle
				</a>
				<button class="go_button" onclick={finish_battle}>
					End Battle Now
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
	{#if battle.data?.type === 'TIMED_MATCH'}
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
					<div class="cluster">
						<button onclick={() => add_overtime(5)}>+5 min</button>
						<button onclick={() => add_overtime(10)}>+10 min</button>
						<button onclick={() => add_overtime(15)}>+15 min</button>
					</div>
				</div>
			</div>
		</Modal>
	{/if}
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

	input[type='number'] {
		width: 80px;
	}
</style>
