<script lang="ts">
	import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import Avatar from '$lib/ui/Avatar.svelte';
	import { get_user_avatar_url } from '$lib/user/utils';
	import AppFrame from './AppFrame.svelte';
	import { FRAME_HEIGHT, FRAME_WIDTH } from '$lib/constants';

	type BattleStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED' | null;
	type ParticipantStatus =
		| 'PENDING'
		| 'ACTIVE'
		| 'READY'
		| 'DROPPED'
		| 'FINISHED'
		| null;

	type ParticipantUser = {
		name: string;
		avatar: string | null;
		image?: string | null;
		username?: string | null;
	};

	type ParticipantHax = {
		id: string;
		html: string;
		css: string;
	};

	type BattleParticipant = {
		id: string;
		user_id: string;
		status: ParticipantStatus;
		display_order?: number | null;
		user?: ParticipantUser;
		hax?: ParticipantHax | null;
	};

	type BattleWithParticipants = {
		id: string;
		status: BattleStatus;
		target_id: string | null;
		participants: readonly BattleParticipant[];
	};
	import CodeFrame from './CodeFrame.svelte';
	import Voting from './Voting.svelte';
	import VotingResults from './VotingResults.svelte';
	import { fly } from 'svelte/transition';
	import type { ParticipantScores } from '$utils/scores';
	import JoinBattler from './JoinBattler.svelte';

	import { copyToClipboard } from '$utils/clipboard';
	import { z } from '$lib/zero.svelte';
	import { PUBLIC_APP_URL } from '$env/static/public';

	const {
		battle,
		votes = false,
		results = false,
		scores,
		join = false
	}: {
		battle: BattleWithParticipants;
		votes?: boolean;
		scores?: ParticipantScores;
		results?: boolean;
		join?: boolean;
	} = $props();

	let me_participant = $derived(
		battle.participants.find((participant) => participant.user_id === z.userID)
	);

	const EXPRESSIONS = ['NORMAL', 'HAPPY', 'SAD', 'ANGRY'] as const;
	type Expression = (typeof EXPRESSIONS)[number];
	const defaultExpression: Expression = 'NORMAL';
	const getExpression = (place?: number) =>
		EXPRESSIONS[place ?? 0] ?? defaultExpression;
	let copied = $state(false);

	/**
	 * Copies text to clipboard and updates the copied state after 1 second
	 */
	async function handleCopy(text: string) {
		try {
			await copyToClipboard(text);
			copied = true;

			// Wait 1 second, then reset the copied state
			setTimeout(() => {
				copied = false;
			}, 1000);
		} catch (error) {
			console.error('Failed to copy:', error);
		}
	}
</script>

<section class="battlers">
	<heading>
		<h3>The Battlers</h3>
	</heading>

	<div class="battlers-grid">
		{#if me_participant?.status !== 'READY' && join}
			<JoinBattler {battle} {me_participant} />
		{/if}
		{#each battle.participants
			.filter((participant) => participant.status === 'READY')
			.sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)) as participant}
			{@const participantScore = scores?.[participant.id]}
			{@const expression = getExpression(participantScore?.place)}
			<div class="battler">
				<div class="top">
					{#if votes && participant.hax}
						<div class="voting-container" in:fly={{ y: 20, opacity: 300 }}>
							<Voting {battle} participant={{ hax: participant.hax }} />
						</div>
					{/if}
					{#if results}
						<div class="voting-container" in:fly={{ y: 20, opacity: 300 }}>
							{#if participantScore}
								<VotingResults score={participantScore} />
							{/if}
						</div>
					{/if}
					<div class="image-frame">
						{#if participant.user}
							<Avatar
								avatar={get_user_avatar_url(participant.user, '/unknown.png')}
								{expression}
							/>
							<h4>{participant.user.name}</h4>
						{/if}
					</div>
				</div>
				<wa-tab-group>
					<wa-tab panel="custom">App</wa-tab>
					<wa-tab panel="general">Code</wa-tab>
					<wa-tab-panel name="custom">
						{#if participant.hax}
							<div
								class="battle-frame"
								style="--frame-width: {FRAME_WIDTH}; --frame-height: {FRAME_HEIGHT};"
							>
								<AppFrame hax={participant.hax} />
							</div>
						{/if}
					</wa-tab-panel>
					<wa-tab-panel name="general"
						><CodeFrame
							html_text={participant.hax?.html ?? ''}
							css_text={participant.hax?.css ?? ''}
						/></wa-tab-panel
					>
				</wa-tab-group>
			</div>
		{/each}
		<div
			class="battler empty-seat"
			onclick={() => handleCopy(`${PUBLIC_APP_URL}/lobby/${battle.id}`)}
		>
			{#if battle.status === 'PENDING'}
				<div class="image-frame">
					<Avatar avatar="/unknown.png" expression="NORMAL" />
					<div class="invite">
						{#if copied}
							<span>✔︎</span>
							<p>Join link copied to clipboard</p>
						{:else}
							<span>+</span>
							<p>Invite Battler</p>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</section>

<style>
	heading {
		background: var(--black);
		display: block;
		box-shadow:
			0 5px 10px rgb(0 0 0 / 0.2),
			0 -1px 1px rgb(255 255 255 / 0.1) inset;
	}
	h3 {
		color: var(--fg);
		background: var(--pink);
		display: inline-block;
		padding: 4px 10px;
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

	.empty-seat {
		cursor: pointer;
		background: linear-gradient(to bottom, rgb(0 0 0 / 0.7), rgb(0 0 0 / 0));
		:global(img) {
			opacity: 0.1;
			transition: 0.2s ease-in-out all;
			filter: grayscale(100%);
			box-shadow: 0 0 10px black inset;
		}
		&:hover :global(img) {
			opacity: 0.2;
		}
	}

	.invite {
		position: absolute;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-direction: column;
		font-size: 20px;
		span {
			display: block;
			font-size: 80px;
			font-weight: 900;
		}
	}
	.image-frame {
		display: grid;
		position: relative;
		grid-template-rows: auto auto;
	}

	.battlers {
		background: hsl(from var(--black) h s 5%);
		min-height: 40vh;
		height: 100%;
	}

	.battlers-grid {
		display: grid;
		height: 100%;
		scrollbar-width: none;
		grid-auto-flow: column;
		grid-auto-columns: 400px;
		overflow-x: scroll;
		width: 100vw;
	}

	.battler {
		border-inline: 2px solid var(--black);
		position: relative;
	}

	.battle-frame {
		width: calc(var(--frame-width) * 1px);
		height: calc(var(--frame-height) * 1px);
		overflow: hidden;
		border-radius: var(--br-s);
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.1),
			0 18px 30px rgb(0 0 0 / 0.35);
	}

	wa-tab-group {
		--indicator-color: var(--pink);
		--track-color: rgb(255 255 255 /0.1);
		--track-width: 1px;
		--wa-color-brand-on-quiet: var(--pink);
	}
	wa-tab {
		font-weight: 900;
		border: none;
	}

	wa-tab::part(base) {
		padding: 5px 15px;
	}

	wa-tab-panel {
		--padding: none;
	}

	.top {
		position: relative;
	}

	.voting-container {
		position: absolute;
		z-index: 1;
		bottom: 0;
		width: 100%;
	}
</style>
