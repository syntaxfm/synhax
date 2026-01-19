<script lang="ts">
	import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
	import { files } from '$lib/state/FileState.svelte';
	import Avatar from '$lib/ui/Avatar.svelte';
	import { s } from '$lib/user/utils';
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { fade } from 'svelte/transition';

	type ParticipantStatus =
		| 'PENDING'
		| 'ACTIVE'
		| 'READY'
		| 'DROPPED'
		| 'FINISHED'
		| null;

	type BattleJoin = {
		id: string;
		target_id: string | null;
		participants: readonly {
			id: string;
			status?: ParticipantStatus;
			display_order?: number | null;
		}[];
	};

	type Participant = {
		id: string;
		status: ParticipantStatus;
	};

	const {
		battle,
		me_participant
	}: {
		battle: BattleJoin;
		me_participant?: Participant | null;
	} = $props();

	let me = z.createQuery(queries.user.current());

	let active_participants = $derived(
		battle.participants.filter(
			(participant) => participant.status !== 'DROPPED'
		)
	);

	let is_full = $derived(active_participants.length >= 2);

	function join_battle() {
		// Make sure target actually exists
		if (battle.target_id) {
			if (is_full) {
				alert('This battle already has two battlers.');
				return;
			}
			const usedOrders = new Set(
				active_participants.map((participant) => participant.display_order ?? 0)
			);
			const displayOrder = usedOrders.has(0) ? 1 : 0;

			// Create hax with files
			z.mutate(
				mutators.hax.insert({
					id: crypto.randomUUID(),
					user_id: z.userID,
					target_id: battle?.target_id || '',
					battle_id: battle?.id || '',
					html: HTML_TEMPLATE,
					css: CSS_TEMPLATE,
					type: 'BATTLE'
				})
			);

			// First create file structure for battle (use battle ID for unique folders)
			files.create_hax_directory(battle.id);

			// Add self as a participant
			z.mutate(
				mutators.battle_participants.insert({
					id: crypto.randomUUID(),
					battle_id: battle?.id || '',
					user_id: z.userID,
					status: 'PENDING' as const,
					display_order: displayOrder
				})
			);
		}
	}

	function leave_battle() {
		if (me_participant && battle?.id) {
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
					battle_id: battle?.id || '',
					user_id: z.userID,
					status: 'READY' as const
				})
			);
		}
	}
</script>

<div class="battler">
	{#if me.data}
		{#if !me_participant}
			<div class="image-frame">
				<Avatar avatar={'/unknown.png'} expression="NORMAL" />
				<h4>You?</h4>
				<div class="joining">
					<p>The battle starts now<br />claim your destiny!</p>
					<button
						class="go_button big_button"
						onclick={join_battle}
						disabled={is_full}
					>
						Join
					</button>
				</div>
			</div>
		{:else if me_participant?.status === 'PENDING'}
			<div class="image-frame me" in:fade>
				<Avatar
					avatar={s(me.data?.avatar) || '/unknown.png'}
					expression="NORMAL"
				/>
				<h4>{me.data.name}</h4>
				<div class="joining">
					<button class="go_button big_button" onclick={lock_in}>Lock In</button
					>
					<button class="go_button red" onclick={leave_battle}>Leave</button>
				</div>
			</div>
		{/if}
	{/if}
</div>

<style>
	.image-frame {
		display: grid;
		position: relative;
		grid-template-rows: auto auto;
		background: linear-gradient(to bottom, rgb(0 0 0 / 0.7), rgb(0 0 0 / 0));
		:global(img) {
			opacity: 0.1;
			transition: 0.2s ease-in-out all;
			filter: grayscale(100%);
			box-shadow: 0 0 10px black inset;
			&:hover {
				opacity: 0.3;
			}
		}
	}
	h4 {
		position: absolute;
		color: var(--teal);
		grid-row: 1 / 2;
		text-transform: uppercase;
		font-size: 26px;
		grid-column: 1/1;
		grid-column: 1 / 1;
		text-shadow: 0 0 5px var(--teal);
		padding-left: 10px;
		padding-bottom: 60px;
		width: 100%;
		background: linear-gradient(to bottom, rgb(0 0 0 / 0.7), rgb(0 0 0 / 0));
	}

	.joining {
		position: absolute;
		width: 100%;
		height: 100%;
		padding: 40px;
		display: flex;
		align-items: center;
		gap: 20px;
		text-align: center;
		justify-content: center;
		flex-direction: column;
		font-size: 20px;
		p {
			text-wrap: balance;
		}
	}
	.me {
		:global(img) {
			filter: grayscale(0%);
		}
	}
</style>
