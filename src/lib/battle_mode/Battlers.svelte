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
	<h3>Battlers</h3>
	<div class="battlers-grid">
		{#each battle?.participants as participant}
			<div class="battler">
				{#if votes}
					<Voting {battle} {participant} />
				{/if}
				{#if results}
					<VotingResults votes={participant.hax.votes} />
				{/if}
				<p>{participant.user.name}</p>
				<p>{participant.status}</p>
				<img src={participant.user?.image} alt="" />
				<CodeFrame html_text={participant.hax.html} css_text={participant.hax.css} />
				<AppFrame hax={participant.hax} />
			</div>
		{/each}
	</div>
</section>

<style>
	.battlers-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 400px));
		overflow-x: scroll;
		overflow-y: hidden;
	}

	.battler {
		border-inline: 4px solid var(--hot);
		& + & {
			border-left: none;
		}
	}
</style>
