<script lang="ts">
	import { CSS_TEMPLATE, HTML_TEMPLATE } from '$lib/constants';
	import { files } from '$lib/state/FileState.svelte';
	import Avatar from '$lib/ui/Avatar.svelte';
	import { s, to_snake_case } from '$lib/user/utils';
	import { get_z } from '$lib/z';
	const z = get_z();
	import { type Battle, type Participants, type Target } from '$sync/schema';
	import { fade, fly } from 'svelte/transition';
	import { Query } from 'zero-svelte';

	const {
		battle,
		me_participant
	}: {
		battle: Battle & { participants: Participants[]; target: Target };
		me_participant: Participants;
	} = $props();

	let me = new Query(z.query.user.where('id', z.userID).one());

	function join_battle() {
		// Make sure target actually exists
		if (battle?.target?.name) {
			// Create hax with files
			z.mutate.hax.insert({
				id: crypto.randomUUID(),
				user_id: z.userID,
				target_id: battle?.target_id || '',
				battle_id: battle?.id || '',
				html: HTML_TEMPLATE,
				css: CSS_TEMPLATE,
				type: 'BATTLE'
			});

			// First create file structure for battle
			files.create_hax_directory(to_snake_case(battle.target.name));

			// Add self as a participant
			z.mutate.battle_participants.insert({
				id: crypto.randomUUID(),
				battle_id: battle?.id || '',
				user_id: z.userID,
				status: 'PENDING' as const,
				display_order: battle?.participants.length || 0
			});
		}
	}

	function leave_battle() {
		if (me_participant && battle?.id) {
			z.mutate.battle_participants.delete({
				id: me_participant.id
			});
		}
	}

	function lock_in() {
		if (me_participant) {
			z.mutate.battle_participants.upsert({
				id: me_participant.id,
				battle_id: battle?.id || '',
				user_id: z.userID,
				status: 'READY' as const
			});
		}
	}
</script>

<div class="battler">
	{#if me.current}
		{#if !me_participant}
			<div class="image-frame">
				<Avatar avatar={'/unknown.png'} expression="NORMAL" />
				<h4>You?</h4>
				<div class="joining">
					<p>The battle starts now<br />claim your destiny!</p>
					<button class="go_button big_button" onclick={join_battle}
						>Join</button
					>
				</div>
			</div>
		{:else if me_participant?.status === 'PENDING'}
			<div class="image-frame me" in:fade>
				<Avatar avatar={s(me.current?.avatar)} expression="NORMAL" />
				<h4>{me.current.name}</h4>
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
