<script lang="ts">
	import type { Battle, Participants, User, Hax, Votes } from '$sync/schema';
	import AppFrame from './AppFrame.svelte';
	import CodeFrame from './CodeFrame.svelte';
	import Voting from './Voting.svelte';
	import VotingResults from './VotingResults.svelte';

	const {
		battle,
		votes = false,
		results = false
	}: {
		battle: Battle & {
			participants: Array<Participants & { user: User; hax: Hax & { votes: Votes } }>;
		};
		votes?: boolean;
		results?: boolean;
	} = $props();
</script>

<section class="battlers">
	<h3>The Battlers</h3>
	{#if battle?.participants.length > 0}
		<div class="battlers-grid">
			{#each battle?.participants as participant}
				<div class="battler">
					{#if votes}
						<Voting {battle} {participant} />
					{/if}
					{#if results}
						<VotingResults votes={participant.hax.votes} />
					{/if}
					<div class="image-frame">
						<img src={participant.user?.image} alt="" />
						<h4>{participant.user.name}</h4>
						<p class="status">{participant.status}</p>
					</div>
					<CodeFrame html_text={participant.hax.html} css_text={participant.hax.css} />
					<AppFrame hax={participant.hax} />
				</div>
			{/each}
		</div>
	{:else}
		<div class="waiting">
			<p>Waiting for battlers..</p>
		</div>
	{/if}
</section>

<style>
	h3 {
		color: var(--white);
		background: var(--pink);
		position: absolute;
		padding: 4px 10px;
	}

	h4 {
		position: absolute;
		color: var(--teal);
		grid-row: 1 / 2;
		text-transform: uppercase;
		font-size: 26px;
		grid-column: 1/1;
	}

	.status {
		grid-row: 2/3;
		grid-column: 1/1;
	}

	.image-frame {
		display: grid;
		grid-template-rows: auto auto;
		img {
			grid-row: 1 / -1;
			grid-column: 1/1;
		}
	}

	.battlers {
		border-top: 1px solid rgb(255 255 255 /0.1);
		background: #222;
		min-height: 40vh;
	}

	.battlers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 400px));
		overflow-x: scroll;
		overflow-y: hidden;
		scrollbar-width: none;
	}

	.battler {
		border-inline: 4px solid var(--pink);
		& + & {
			border-left: none;
		}
	}
	.waiting {
		text-align: center;
		opacity: 0.6;
		p {
			font-size: 20px;
			margin-top: 2rem;
		}
	}
</style>
