<script lang="ts">
	import NewBattleButton from '$lib/battle_mode/NewBattleButton.svelte';
	import { type Rating, type Target } from '$sync/schema';

	const {
		target
	}: {
		target: Target & {
			ratings: readonly Rating[];
		};
	} = $props();

	const averaged_ratings = $derived.by(() => {
		if (target.ratings.length === 0) {
			return {
				difficulty: 0,
				creativity: 0,
				fun: 0,
				coolness: 0
			};
		}

		const totals = target.ratings.reduce(
			(acc, r) => ({
				difficulty: acc.difficulty + r.difficulty,
				creativity: acc.creativity + r.creativity,
				fun: acc.fun + r.fun,
				coolness: acc.coolness + r.coolness
			}),
			{ difficulty: 0, creativity: 0, fun: 0, coolness: 0 }
		);

		return {
			difficulty: totals.difficulty / target.ratings.length,
			creativity: totals.creativity / target.ratings.length,
			fun: totals.fun / target.ratings.length,
			coolness: totals.coolness / target.ratings.length
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
		<NewBattleButton target_id={target.id} />
	</div>
</article>

<style>
	.target-card {
		--card-padding: clamp(1rem, 2vw, 1.5rem);
		--image-radius: var(--br-m);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		border-radius: var(--br-l);
		background: hsl(from var(--black) h s 4%);
		border: 1px solid rgb(255 255 255 / 0.06);
		box-shadow:
			0 18px 30px rgb(0 0 0 / 0.35),
			0 1px 0 rgb(255 255 255 / 0.05) inset;
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease;
		&:hover {
			transform: translateY(-2px);
			box-shadow:
				0 22px 36px rgb(0 0 0 / 0.4),
				0 1px 0 rgb(255 255 255 / 0.06) inset;
		}
	}

	.image-wrapper {
		position: relative;
		margin: var(--card-padding);
		margin-bottom: 0;
		aspect-ratio: 1 / 1;
		border-radius: var(--image-radius);
		overflow: hidden;
		box-shadow:
			0 0 0 1px rgb(255 255 255 / 0.08),
			0 12px 20px rgb(0 0 0 / 0.35);
	}

	.image-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: saturate(0.95) contrast(1.02);
	}

	.preview-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		z-index: 1;
		width: 36px;
		height: 36px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: rgb(0 0 0 / 0.45);
		border: 1px solid rgb(255 255 255 / 0.15);
		border-radius: 999px;
		padding: 0;
		cursor: pointer;
		color: var(--white);
		backdrop-filter: blur(12px);
		transition:
			transform 0.15s ease,
			box-shadow 0.2s ease,
			background 0.2s ease;

		&:hover {
			background: rgb(0 0 0 / 0.65);
			box-shadow: 0 10px 18px rgb(0 0 0 / 0.35);
			transform: translateY(-1px);
		}
	}

	.preview-popover {
		position: fixed;
		inset: 0;
		margin: auto;
		border: none;
		border-radius: var(--br-l);
		background: var(--bg);
		padding: var(--space-s);
		box-shadow: var(--shadow-5);
		max-width: 90vw;
		max-height: 90vh;
		width: fit-content;
		height: fit-content;

		&::backdrop {
			background: oklch(0 0 0 / 0.8);
		}

		img {
			max-width: 100%;
			max-height: 85vh;
			border-radius: var(--br-m);
			object-fit: contain;
		}
	}

	.content {
		padding: 0 var(--card-padding) 12px;
		margin-top: -28px;
		position: relative;
		z-index: 1;
		background: linear-gradient(
			180deg,
			rgb(0 0 0 / 0) 0%,
			rgb(0 0 0 / 0.45) 45%,
			rgb(0 0 0 / 0.8) 100%
		);
		border-radius: 0 0 var(--br-l) var(--br-l);
		padding-bottom: 1.25rem;
	}

	.title-row {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 8px;
	}

	h2 {
		font-size: var(--step-1);
		font-weight: 600;
		margin: 0;
		line-height: 1.2;
	}

	.badge {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 4px 10px;
		background: rgb(0 0 0 / 0.55);
		border: 1px solid rgb(255 255 255 / 0.2);
		border-radius: 999px;
		white-space: nowrap;
		color: var(--white);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 8px;
		margin-top: 10px;
		color: var(--white);
	}

	.meta .tag {
		--tag-color: var(--slate);
		color: var(--white);
		border-color: rgb(255 255 255 / 0.2);
		background: rgb(0 0 0 / 0.45);
	}

	.rating {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 14px;
		font-weight: 600;
		color: var(--white);

		svg {
			color: var(--yellow);
		}
	}

	.action {
		padding: 0 var(--card-padding) var(--card-padding);
		margin-top: auto;

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
