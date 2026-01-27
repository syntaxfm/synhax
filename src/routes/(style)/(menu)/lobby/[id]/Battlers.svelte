<script lang="ts">
	import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
	import { files } from '$lib/state/FileState.svelte';
	import { mutators, z } from '$lib/zero.svelte';
	import { parseTargetCode } from '$utils/code';
	import PlayerCard from './PlayerCard.svelte';

	type ParticipantStatus =
		| 'PENDING'
		| 'ACTIVE'
		| 'READY'
		| 'DROPPED'
		| 'FINISHED'
		| null;

	type Battler = {
		id: string;
		user_id: string;
		status: ParticipantStatus;
		display_order?: number | null;
		user?: {
			name: string;
			username?: string | null;
			image?: string | null;
			avatar?: string | null;
		};
		hax?: {
			id: string;
		} | null;
	};

	type BattleWithParticipants = {
		id: string;
		target_id: string | null;
		target?: {
			name?: string | null;
			type?: string | null;
			inspo?: string | null;
		} | null;
		participants: readonly Battler[];
	};

	const {
		battle,
		is_referee = false
	}: {
		battle: BattleWithParticipants;
		is_referee?: boolean;
	} = $props();

	let me_participant = $derived(
		battle.participants.find((participant) => participant.user_id === z.userID)
	);

	// Check if the user was invited but hasn't set up files yet
	let needs_file_setup = $derived(me_participant && !me_participant.hax);

	let active_participants = $derived(
		battle.participants.filter(
			(participant) => participant.status !== 'DROPPED'
		)
	);

	let display_participants = $derived.by(() => {
		return [...active_participants]
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
			.slice(0, 2);
	});

	/**
	 * Set up files for an invited user (who already has a participant entry but no hax)
	 */
	async function setup_files() {
		if (!battle.target?.name || !me_participant) {
			return;
		}

		const has_access =
			files.status === 'ACCESS' || (await files.restore_directory_handle());
		if (!has_access) {
			alert('File access is required to set up your battle files.');
			return;
		}

		// Parse target code to get starter HTML/CSS if available
		const targetCode = parseTargetCode(battle.target?.inspo ?? '');
		const starterHtml = targetCode.starter_html || HTML_TEMPLATE;
		const starterCss = targetCode.starter_css || CSS_TEMPLATE;

		try {
			await files.create_hax_directory(
				battle.id,
				targetCode.starter_html || undefined,
				targetCode.starter_css || undefined
			);
		} catch (error) {
			console.error('Failed to create battle folder:', error);
			alert('Unable to create your battle folder.');
			return;
		}

		// Create the hax entry (participant already exists from invite)
		z.mutate(
			mutators.hax.insert({
				id: crypto.randomUUID(),
				user_id: z.userID,
				target_id: battle.target_id || '',
				battle_id: battle.id,
				html: starterHtml,
				css: starterCss,
				type: 'BATTLE'
			})
		);
	}

	async function join_battle() {
		if (!battle.target?.name) {
			return;
		}

		const activeParticipants = battle.participants.filter(
			(participant) => participant.status !== 'DROPPED'
		);
		if (activeParticipants.length >= 2) {
			alert('This battle already has two battlers.');
			return;
		}

		const has_access =
			files.status === 'ACCESS' || (await files.restore_directory_handle());
		if (!has_access) {
			alert('File access is required to join this battle.');
			return;
		}

		// Parse target code to get starter HTML/CSS if available
		const targetCode = parseTargetCode(battle.target?.inspo ?? '');
		const starterHtml = targetCode.starter_html || HTML_TEMPLATE;
		const starterCss = targetCode.starter_css || CSS_TEMPLATE;

		try {
			await files.create_hax_directory(
				battle.id,
				targetCode.starter_html || undefined,
				targetCode.starter_css || undefined
			);
		} catch (error) {
			console.error('Failed to create battle folder:', error);
			alert('Unable to create your battle folder.');
			return;
		}

		const usedOrders = new Set(
			activeParticipants.map((participant) => participant.display_order ?? 0)
		);
		const displayOrder = usedOrders.has(0) ? 1 : 0;

		z.mutate(
			mutators.hax.insert({
				id: crypto.randomUUID(),
				user_id: z.userID,
				target_id: battle.target_id || '',
				battle_id: battle.id,
				html: starterHtml,
				css: starterCss,
				type: 'BATTLE'
			})
		);

		z.mutate(
			mutators.battle_participants.insert({
				id: crypto.randomUUID(),
				battle_id: battle.id,
				user_id: z.userID,
				status: 'PENDING' as const,
				display_order: displayOrder
			})
		);
	}

	function leave_battle() {
		if (me_participant) {
			z.mutate(
				mutators.battle_participants.delete({
					id: me_participant.id
				})
			);
		}
	}

	function lock_in() {
		if (me_participant) {
			z.mutate(
				mutators.battle_participants.upsert({
					id: me_participant.id,
					battle_id: battle.id,
					user_id: z.userID,
					status: 'READY' as const
				})
			);
		}
	}

	function kick_player(participant_id: string) {
		if (!is_referee) return;
		z.mutate(
			mutators.battle_participants.kick({
				id: participant_id,
				battle_id: battle.id
			})
		);
	}
</script>

<section class="stack">
	<h2 class="game-title">Battlers</h2>

	{#if !me_participant}
		<button
			class="battle-button"
			onclick={join_battle}
			disabled={active_participants.length >= 2}
		>
			Join Battle
		</button>
	{:else if needs_file_setup}
		<div class="stack invited-notice">
			<p>You've been invited to this battle!</p>
			<button class="battle-button" onclick={setup_files}>
				Set Up Files & Accept
			</button>
		</div>
	{/if}

	<div class="layout-card" style="--min-card-width: 180px;">
		{#each display_participants as battler}
			<PlayerCard
				{battler}
				{is_referee}
				onlockin={lock_in}
				onleave={leave_battle}
				onkick={() => kick_player(battler.id)}
			/>
		{/each}
	</div>
</section>

<style>
	.invited-notice {
		text-align: center;
		padding: var(--pad-m);
		background: hsl(from var(--black) h s 8%);
		border-radius: var(--br-m);
		border: 1px solid rgb(255 255 255 / 0.1);
	}

	.invited-notice p {
		margin: 0;
		color: var(--fg-muted);
	}
</style>
