<script lang="ts">
	import NewBattleButton from '$lib/battle_mode/NewBattleButton.svelte';
	import NewSoloButton from '$lib/battle_mode/NewSoloButton.svelte';
	import { type Rating, type Target } from '$sync/schema';
	import type { Snippet } from 'svelte';

	const {
		target,
		action
	}: {
		target: Target & {
			ratings?: readonly Rating[] | null;
		};
		action?: Snippet;
	} = $props();

	const ratings = $derived(target.ratings ?? []);

	const averaged_ratings = $derived.by(() => {
		if (ratings.length === 0) {
			return {
				difficulty: 0,
				creativity: 0,
				fun: 0,
				coolness: 0
			};
		}

		const totals = ratings.reduce(
			(acc, r) => ({
				difficulty: acc.difficulty + r.difficulty,
				creativity: acc.creativity + r.creativity,
				fun: acc.fun + r.fun,
				coolness: acc.coolness + r.coolness
			}),
			{ difficulty: 0, creativity: 0, fun: 0, coolness: 0 }
		);

		return {
			difficulty: totals.difficulty / ratings.length,
			creativity: totals.creativity / ratings.length,
			fun: totals.fun / ratings.length,
			coolness: totals.coolness / ratings.length
		};
	});

	// Calculate overall rating (average of all categories)
	const overall_rating = $derived(
		averaged_ratings.difficulty > 0
			? (
					(averaged_ratings.difficulty +
						averaged_ratings.creativity +
						averaged_ratings.fun +
						averaged_ratings.coolness) /
					4
				).toFixed(1)
			: null
	);

	// Difficulty label based on rating
	const difficulty_label = $derived.by(() => {
		const d = averaged_ratings.difficulty;
		if (d === 0) return null;
		if (d <= 2) return 'Easy';
		if (d <= 3.5) return 'Medium';
		return 'Hard';
	});
</script>

<article class="target-card">
	<!-- Image with rounded corners, inset from card edge -->
	<div class="image-wrapper">
		<img src={target.image} alt={target.name} />
		<button
			class="preview-btn"
			popovertarget="preview-{target.id}"
			aria-label="Preview full size"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="15 3 21 3 21 9"></polyline>
				<polyline points="9 21 3 21 3 15"></polyline>
				<line x1="21" y1="3" x2="14" y2="10"></line>
				<line x1="3" y1="21" x2="10" y2="14"></line>
			</svg>
		</button>
	</div>

	<div id="preview-{target.id}" popover class="preview-popover">
		<img src={target.image} alt={target.name} />
	</div>

	<!-- Content overlaps bottom of image via negative margin -->
	<div class="content">
		<div class="title-row">
			<h2>{target.name}</h2>
			{#if difficulty_label}
				<span class="badge">{difficulty_label}</span>
			{/if}
		</div>

		<div class="meta">
			{#if overall_rating}
				<span class="rating">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
					>
						<polygon
							points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
						></polygon>
					</svg>
					{overall_rating}
				</span>
			{/if}
			<span class="tag muted" style="--tag-color: var(--slate);"
				>{target.type}</span
			>
		</div>
	</div>

	<!-- Button at bottom with pill shape -->
	<div class="action">
		{#if action}
			{@render action()}
		{:else}
			<div class="default-actions">
				<NewBattleButton target_id={target.id} />
				<NewSoloButton target_id={target.id} />
			</div>
		{/if}
	</div>
</article>

<style>
	.target-card {
		--card-padding: var(--pad-l);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--br-m);
		background: var(--surface-1);
		border: 1px solid var(--border-subtle);
		transition: border-color 0.15s ease;
		&:hover {
			border-color: var(--border-default);
		}
	}

	.image-wrapper {
		position: relative;
		margin: var(--card-padding);
		margin-bottom: 0;
		aspect-ratio: 1 / 1;
		border-radius: var(--br-s);
		overflow: hidden;
		border: 1px solid var(--border-subtle);
	}

	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: blur(30px);
		transform: scale(1.04);
	}

	.preview-btn {
		position: absolute;
		top: var(--pad-s);
		right: var(--pad-s);
		z-index: 1;
		width: 1.75rem;
		height: 1.75rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-0);
		border: 1px solid var(--border-default);
		border-radius: var(--br-s);
		padding: 0;
		cursor: pointer;
		color: var(--fg);
		opacity: 0;
		transition: opacity 0.15s ease;

		&:hover {
			background: var(--surface-2);
		}
	}

	.image-wrapper:hover .preview-btn {
		opacity: 1;
	}

	.preview-popover {
		position: fixed;
		inset: 0;
		margin: auto;
		border: none;
		border-radius: var(--br-m);
		background: var(--surface-1);
		padding: var(--pad-m);
		box-shadow: var(--shadow-5);
		max-width: 90vw;
		max-height: 90vh;
		width: fit-content;
		height: fit-content;

		&::backdrop {
			background: oklch(0 0 0 / 0.85);
		}

		img {
			max-width: 100%;
			max-height: 85vh;
			border-radius: var(--br-s);
			object-fit: contain;
			filter: blur(30px);
			transform: scale(1.04);
		}
	}

	.content {
		padding: var(--pad-m) var(--card-padding) var(--pad-s);
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: var(--pad-s);
	}

	h2 {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
		line-height: 1.3;
	}

	.badge {
		font-size: 0.6rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		padding: var(--pad-xs) var(--pad-m);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		white-space: nowrap;
		color: var(--fg-7);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--pad-s);
		margin-top: var(--pad-s);
	}

	.meta .tag {
		font-size: 0.65rem;
		padding: var(--pad-xs) var(--pad-s);
		background: var(--surface-2);
		border: 1px solid var(--border-subtle);
		border-radius: var(--br-s);
		color: var(--fg-6);
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: var(--pad-xs);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--fg);

		svg {
			color: var(--yellow);
		}
	}

	.action {
		padding: 0 var(--card-padding) var(--card-padding);
		margin-top: auto;

		.default-actions {
			display: grid;
			gap: var(--pad-s);
		}

		:global(button),
		:global(.button) {
			width: 100%;
			justify-content: center;
			background: hsl(from var(--black) h s 6%);
			border: 1px solid rgb(255 255 255 / 0.18);
			border-radius: 999px;
			color: var(--yellow);
			font-weight: 600;
			letter-spacing: 0.08em;
			text-transform: uppercase;
			font-size: 0.9rem;
			padding: 0.8rem 1.25rem;
			box-shadow:
				0 12px 24px rgb(0 0 0 / 0.4),
				0 1px 0 rgb(255 255 255 / 0.08) inset;
			transition:
				transform 0.15s ease,
				box-shadow 0.2s ease,
				background 0.2s ease;
			&:hover {
				background: hsl(from var(--black) h s 10%);
				box-shadow:
					0 16px 30px rgb(0 0 0 / 0.5),
					0 1px 0 rgb(255 255 255 / 0.1) inset;
				transform: translateY(-1px);
			}
		}
	}
</style>
