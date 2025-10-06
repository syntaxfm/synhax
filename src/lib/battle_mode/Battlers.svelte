<script lang="ts">
	import '@awesome.me/webawesome/dist/components/tab-group/tab-group.js';
	import Avatar from '$lib/ui/Avatar.svelte';
	import { s } from '$lib/user/utils';
	import type { Battle, Participants, User, Hax, Votes } from '$sync/schema';
	import AppFrame from './AppFrame.svelte';
	import CodeFrame from './CodeFrame.svelte';
	import Voting from './Voting.svelte';
	import VotingResults from './VotingResults.svelte';
	import { fly } from 'svelte/transition';
	import type { ParticipantScores } from '$utils/scores';
	import JoinBattler from './JoinBattler.svelte';

	import { copyToClipboard } from '$utils/clipboard';
	import { get_z } from '$lib/z';
	const z = get_z();

	const {
		battle,
		votes = false,
		results = false,
		scores,
		join = false
	}: {
		battle: Battle & {
			participants: Array<
				Participants & { user: User; hax: Hax & { votes: Votes[] } }
			>;
		};
		votes?: boolean;
		scores?: ParticipantScores[];
		results?: boolean;
	} = $props();

	let me_participant = $derived(
		battle?.participants.find((p: Participants) => p.user_id === z.userID)
	);

	const EXPRESSIONS = ['NORMAL', 'HAPPY', 'SAD', 'ANGRY'];
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
		{#each battle?.participants.filter((p) => p.status === 'READY') as participant}
			{@const expression = scores
				? EXPRESSIONS[scores[participant.id].place]
				: 'NORMAL'}
			<div class="battler">
				<div class="top">
					{#if votes}
						<div class="voting-container" in:fly={{ y: 20, opacity: 300 }}>
							<Voting {battle} {participant} />
						</div>
					{/if}
					{#if results}
						<div class="voting-container" in:fly={{ y: 20, opacity: 300 }}>
							{#if scores}
								<VotingResults
									votes={participant.hax.votes}
									score={scores[participant.id]}
								/>
							{/if}
						</div>
					{/if}
					<div class="image-frame">
						<Avatar avatar={s(participant.user?.avatar)} {expression} />
						<h4>{participant.user.name}</h4>
					</div>
				</div>
				<wa-tab-group>
					<wa-tab panel="custom">App</wa-tab>
					<wa-tab panel="general">Code</wa-tab>
					<wa-tab-panel name="custom"
						><AppFrame hax={participant.hax} /></wa-tab-panel
					>
					<wa-tab-panel name="general"
						><CodeFrame
							html_text={participant?.hax?.html}
							css_text={participant.hax.css}
						/></wa-tab-panel
					>
				</wa-tab-group>
			</div>
		{/each}
		<div
			class="battler empty-seat"
			type="button"
			onclick={() =>
				handleCopy(`http://localhost:5173/battle/${battle.id}/lobby`)}
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
		color: var(--white);
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
