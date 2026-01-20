<script lang="ts">
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import CodeFrame from '$lib/battle_mode/CodeFrame.svelte';
	import { parseTargetCode } from '$utils/code';
	import sentinel from '../../routes/(style)/(app)/battle/sentinel-dark.css?raw';

	type RecapTone = 'win' | 'loss' | 'neutral';

	type RecapParticipant = {
		id?: string;
		user?: { name?: string | null } | null;
		hax?: {
			html?: string | null;
			css?: string | null;
			diff_score?: number | null;
		} | null;
		outcomeLabel?: string;
		tone?: RecapTone;
	};

	type BattleTarget = {
		name?: string | null;
		image?: string | null;
		type?: string | null;
		inspo?: string | null;
	};

	const {
		participants = [],
		target = null
	}: {
		participants?: RecapParticipant[];
		target?: BattleTarget | null;
	} = $props();

	const formatScore = (score: number) =>
		`${(Math.floor(Math.max(0, Math.min(100, score)) * 100) / 100).toFixed(2)}%`;

	const targetImage = $derived(target?.image ?? '');
	const isCodeTarget = $derived(target?.type === 'CODE');
	const targetCode = $derived(parseTargetCode(target?.inspo ?? ''));
	const targetFrameData = $derived({
		html: targetCode.html,
		css: targetCode.css
	});
	const leftParticipant = $derived(participants[0] ?? null);
	const rightParticipant = $derived(participants[1] ?? null);
</script>

<svelte:head>
	{@html `<style>${sentinel}</style>`}
</svelte:head>

<div class="recap-grid battle-panel">
	{#if leftParticipant}
		{@const tone = leftParticipant.tone ?? 'neutral'}
		{@const outcomeLabel = leftParticipant.outcomeLabel ?? 'Battler'}
		<article
			class="stack battler-card"
			class:win={tone === 'win'}
			class:loss={tone === 'loss'}
			class:neutral={tone === 'neutral'}
			style="--gap: 1.5rem;"
		>
			<div class="stack battler-hero" style="--gap: 0.5rem;">
				<span
					class="tag battle-outcome"
					class:win={tone === 'win'}
					class:loss={tone === 'loss'}
					class:neutral={tone === 'neutral'}
				>
					{outcomeLabel}
				</span>
				<div class="battler-meta">
					<h3>{leftParticipant.user?.name ?? 'Battler'}</h3>
					{#if leftParticipant.hax?.diff_score !== null && leftParticipant.hax?.diff_score !== undefined}
						<span
							class="tag battle-score"
							class:win={tone === 'win'}
							class:loss={tone === 'loss'}
							class:neutral={tone === 'neutral'}
						>
							{formatScore(leftParticipant.hax.diff_score)} Match
						</span>
					{/if}
				</div>
			</div>
			<div class="battler-panels">
				<div class="stack" style="--gap: 0.5rem;">
					<span class="status-badge">Result</span>
					<div class="result-frame battle-frame battle-frame--bordered">
						<AppFrame
							hax={{
								html: leftParticipant.hax?.html ?? '',
								css: leftParticipant.hax?.css ?? ''
							}}
						/>
					</div>
				</div>
				<div class="code-panel">
					<CodeFrame
						html_text={leftParticipant.hax?.html ?? ''}
						css_text={leftParticipant.hax?.css ?? ''}
					/>
				</div>
			</div>
		</article>
	{/if}

	{#if target}
		<div class="stack target-card" style="--gap: 0.5rem;">
			<span class="status-badge">Target</span>
			<div class="target-frame battle-frame battle-frame--bordered">
				{#if isCodeTarget}
					<AppFrame hax={targetFrameData} />
				{:else}
					<img src={targetImage} alt={target.name ?? 'Target'} />
				{/if}
			</div>
		</div>
	{/if}

	{#if rightParticipant}
		{@const tone = rightParticipant.tone ?? 'neutral'}
		{@const outcomeLabel = rightParticipant.outcomeLabel ?? 'Battler'}
		<article
			class="stack battler-card"
			class:win={tone === 'win'}
			class:loss={tone === 'loss'}
			class:neutral={tone === 'neutral'}
			style="--gap: 1.5rem;"
		>
			<div class="stack battler-hero" style="--gap: 0.5rem;">
				<span
					class="tag battle-outcome"
					class:win={tone === 'win'}
					class:loss={tone === 'loss'}
					class:neutral={tone === 'neutral'}
				>
					{outcomeLabel}
				</span>
				<div class="battler-meta">
					<h3>{rightParticipant.user?.name ?? 'Battler'}</h3>
					{#if rightParticipant.hax?.diff_score !== null && rightParticipant.hax?.diff_score !== undefined}
						<span
							class="tag battle-score"
							class:win={tone === 'win'}
							class:loss={tone === 'loss'}
							class:neutral={tone === 'neutral'}
						>
							{formatScore(rightParticipant.hax.diff_score)} Match
						</span>
					{/if}
				</div>
			</div>
			<div class="battler-panels">
				<div class="stack" style="--gap: 0.5rem;">
					<span class="status-badge">Result</span>
					<div class="result-frame battle-frame battle-frame--bordered">
						<AppFrame
							hax={{
								html: rightParticipant.hax?.html ?? '',
								css: rightParticipant.hax?.css ?? ''
							}}
						/>
					</div>
				</div>
				<div class="code-panel">
					<CodeFrame
						html_text={rightParticipant.hax?.html ?? ''}
						css_text={rightParticipant.hax?.css ?? ''}
					/>
				</div>
			</div>
		</article>
	{/if}
</div>

<style>
	.battler-hero {
		align-items: flex-start;
	}

	.battler-meta {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.battler-card {
		padding: 1.5rem;
		border-radius: var(--br-l);
		background: hsl(from var(--black) h s 4%);
		border: 1px solid rgb(255 255 255 / 0.06);
		box-shadow:
			0 18px 30px rgb(0 0 0 / 0.35),
			0 1px 0 rgb(255 255 255 / 0.05) inset;
	}

	.battler-card.win {
		background: linear-gradient(
			135deg,
			hsl(from var(--yellow) h 50% 10%),
			hsl(from var(--black) h s 3%)
		);
		border-color: rgb(250 191 71 / 0.35);
		box-shadow:
			0 18px 40px rgb(0 0 0 / 0.45),
			0 1px 0 rgb(255 255 255 / 0.08) inset;
	}

	.battler-card.loss {
		background: linear-gradient(
			135deg,
			hsl(from var(--slate) h s 6%),
			hsl(from var(--black) h s 3%)
		);
		border-color: rgb(148 163 184 / 0.2);
	}

	.battler-card.neutral {
		background: hsl(from var(--black) h s 4%);
	}

	.battler-card h3 {
		margin: 0;
		font-size: 1.35rem;
		letter-spacing: 0.01em;
	}

	.battle-outcome,
	.battle-score {
		--tag-color: var(--gray);
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.battle-outcome.win,
	.battle-score.win {
		--tag-color: var(--yellow);
	}

	.battle-outcome.loss,
	.battle-score.loss {
		--tag-color: var(--slate);
	}

	.battle-outcome.neutral,
	.battle-score.neutral {
		--tag-color: var(--gray);
	}

	.battle-score {
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	@media (max-width: 1200px) {
		.recap-grid {
			grid-template-columns: 1fr;
		}
	}

	.recap-grid {
		display: grid;
		gap: var(--pad-l);
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: start;
	}

	.target-card {
		align-items: center;
	}

	.battler-panels {
		display: grid;
		gap: var(--pad-m);
		grid-template-columns: minmax(240px, 1fr);
		align-items: start;
	}

	.battler-card .status-badge {
		letter-spacing: 0.12em;
		font-weight: 700;
	}

	.result-frame,
	.target-frame {
		width: 400px;
		height: 300px;
		background: var(--black);
	}

	.result-frame img,
	.result-frame :global(iframe),
	.target-frame img,
	.target-frame :global(iframe) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.code-panel {
		border-radius: var(--br-s);
		overflow: hidden;
		border: 1px solid rgb(255 255 255 / 0.08);
		background: hsl(from var(--black) h s 4%);
		box-shadow: 0 12px 24px rgb(0 0 0 / 0.25);
	}

	.code-panel :global(pre) {
		margin: 0;
	}
</style>
