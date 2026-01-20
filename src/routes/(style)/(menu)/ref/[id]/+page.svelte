<script lang="ts">
	import { page } from '$app/state';
	import Countdown from '$lib/battle_mode/Countdown.svelte';
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import BattlerProgress from '$lib/battle_mode/BattlerProgress.svelte';
	import { queries, z } from '$lib/zero.svelte';
	import type { Participants } from '$sync/schema';
	import { parseTargetCode } from '$utils/code';
	import { remove_screaming } from '$utils/formatting';

	const formatScore = (score: number) =>
		`${(Math.floor(Math.max(0, Math.min(100, score)) * 100) / 100).toFixed(2)}%`;

	let battle = $derived(
		z.createQuery(queries.battles.byId({ id: page?.params?.id || '' }))
	);

	const display_participants = $derived.by(() => {
		const participants = battle.data?.participants ?? [];
		const sorted = [...participants].sort(
			(a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
		);
		return sorted.filter((participant) => participant.user).slice(0, 2);
	});

	const left_battler = $derived(display_participants[0] ?? null);
	const right_battler = $derived(display_participants[1] ?? null);

	const targetImage = $derived(battle.data?.target?.image ?? '');
	const isCodeTarget = $derived(battle.data?.target?.type === 'CODE');
	const targetCode = $derived(
		parseTargetCode(battle.data?.target?.inspo ?? '')
	);
	const targetFrameData = $derived({
		html: targetCode.html,
		css: targetCode.css
	});
</script>

{#if battle.data}
	<div class="stack battle-surface ref-layout" style="--gap: 2rem;">
		<header class="stack battle-panel" style="--gap: 0.75rem;">
			<div class="stack" style="--gap: 0.35rem; text-align: center;">
				<h1>{battle.data.target?.name ?? 'Battle'} Ref View</h1>
				<div class="cluster recap-tags" style="justify-content: center;">
					<span class="tag muted" style="--tag-color: var(--slate);">
						{remove_screaming(battle.data.type ?? '')}
					</span>
					<span class="tag muted" style="--tag-color: var(--gray);">
						{remove_screaming(battle.data.status ?? '')}
					</span>
				</div>
			</div>

			{#if battle.data.status === 'ACTIVE'}
				<div class="cluster" style="justify-content: center;">
					<Countdown battle={battle.data} view="REF" />
				</div>
			{/if}
		</header>

		<section class="stack" style="--gap: 1rem;">
			<div class="recap-grid battle-panel">
				{#if left_battler?.user}
					<article class="stack battler-card" style="--gap: 1.5rem;">
						<div class="stack battler-hero" style="--gap: 0.5rem;">
							<span class="tag battle-outcome neutral">Battler</span>
							<div class="battler-meta">
								<h3>{left_battler.user?.name ?? 'Battler'}</h3>
								{#if left_battler.hax?.diff_score !== null && left_battler.hax?.diff_score !== undefined}
									<span class="tag battle-score neutral">
										{formatScore(left_battler.hax.diff_score)} Match
									</span>
								{/if}
							</div>
						</div>
						<div class="battler-panels">
							<div class="stack" style="--gap: 0.5rem;">
								<span class="status-badge">Progress</span>
								<div class="code-panel">
									<BattlerProgress
										user={left_battler.user}
										hax={left_battler.hax ?? null}
										position="left"
										color="var(--blue)"
									/>
								</div>
							</div>
							<div class="code-panel">
								<span class="status-badge">Status</span>
								<div class="stack" style="--gap: 0.5rem;">
									<span class="tag muted" style="--tag-color: var(--slate);">
										{left_battler.status ?? 'PENDING'}
									</span>
								</div>
							</div>
						</div>
					</article>
				{/if}

				<div class="stack target-card" style="--gap: 0.5rem;">
					<span class="status-badge">Target</span>
					<div class="target-frame battle-frame battle-frame--bordered">
						{#if isCodeTarget}
							<AppFrame hax={targetFrameData} />
						{:else}
							<img
								src={targetImage}
								alt={battle.data.target?.name ?? 'Target'}
							/>
						{/if}
					</div>
				</div>

				{#if right_battler?.user}
					<article class="stack battler-card" style="--gap: 1.5rem;">
						<div class="stack battler-hero" style="--gap: 0.5rem;">
							<span class="tag battle-outcome neutral">Battler</span>
							<div class="battler-meta">
								<h3>{right_battler.user?.name ?? 'Battler'}</h3>
								{#if right_battler.hax?.diff_score !== null && right_battler.hax?.diff_score !== undefined}
									<span class="tag battle-score neutral">
										{formatScore(right_battler.hax.diff_score)} Match
									</span>
								{/if}
							</div>
						</div>
						<div class="battler-panels">
							<div class="stack" style="--gap: 0.5rem;">
								<span class="status-badge">Progress</span>
								<div class="code-panel">
									<BattlerProgress
										user={right_battler.user}
										hax={right_battler.hax ?? null}
										position="right"
										color="var(--red)"
									/>
								</div>
							</div>
							<div class="code-panel">
								<span class="status-badge">Status</span>
								<div class="stack" style="--gap: 0.5rem;">
									<span class="tag muted" style="--tag-color: var(--slate);">
										{right_battler.status ?? 'PENDING'}
									</span>
								</div>
							</div>
						</div>
					</article>
				{/if}
			</div>
		</section>
	</div>
{:else}
	<p>Loading battle...</p>
{/if}

<style>
	h1,
	h2,
	h3 {
		margin: 0;
	}

	.target-thumbnail {
		width: 80px;
		height: 80px;
		object-fit: cover;
		border-radius: var(--br-m);
		border: none;
		box-shadow: none;
	}

	.recap-tags {
		--gap: 0.5rem;
	}

	.ref-layout {
		min-height: 100%;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.ref-layout > section {
		display: flex;
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

	.battler-card h3 {
		margin: 0;
		font-size: 1.35rem;
		letter-spacing: 0.01em;
	}

	@media (max-width: 1200px) {
		.recap-grid {
			grid-template-columns: 1fr;
		}
	}

	.battler-hero {
		align-items: flex-start;
	}

	.battler-meta {
		display: flex;
		align-items: baseline;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.battle-outcome,
	.battle-score {
		--tag-color: var(--gray);
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.battle-score {
		font-weight: 600;
		letter-spacing: 0.05em;
	}

	.recap-grid {
		display: grid;
		gap: var(--pad-l);
		grid-template-columns: repeat(3, minmax(0, 1fr));
		align-items: start;
	}

	@media (max-width: 1200px) {
		.recap-grid {
			grid-template-columns: 1fr;
		}
	}

	.target-card {
		align-items: center;
	}

	.target-frame {
		width: 600px;
		height: 400px;
		background: var(--black);
	}

	.target-frame img,
	.target-frame :global(iframe) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.battler-panels {
		display: grid;
		gap: var(--pad-m);
		grid-template-columns: minmax(240px, 1fr);
		align-items: start;
	}

	.battler-panels .code-panel {
		display: grid;
		gap: var(--pad-s);
		padding: var(--pad-s);
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

	.muted {
		color: var(--fg-muted);
	}

	.ref-progress {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		gap: var(--pad-l);
		align-items: center;
	}

	.ref-progress__side {
		display: flex;
		flex-direction: column;
		gap: var(--pad-s);
	}

	.ref-name {
		font-size: 0.95rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--fg);
	}

	.ref-target {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--pad-s);
	}

	.ref-target__frame {
		width: 220px;
		height: 160px;
		background: var(--black);
	}
</style>
