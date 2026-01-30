<script lang="ts">
	/**
	 * BattlerProgress - Shows a battler's progress with their avatar positioned along a progress bar.
	 *
	 * The avatar sits at the current progress point on a colored bar.
	 */
	import { get_user_avatar_url } from '$lib/user/utils';
	import type { User, Hax } from '$sync/schema';

	interface Props {
		user: User;
		hax: Hax | null;
		/** Position: left or right side of header */
		position: 'left' | 'right';
		/** Optional custom color for the progress bar */
		color?: string;
	}

	let { user, hax, position, color }: Props = $props();

	// Get the score (0-100) or default to 0
	const score = $derived(Math.max(0, Math.min(100, hax?.diff_score ?? 0)));

	// Default colors based on position (using Mad CSS colors)
	const barColor = $derived(
		color ?? (position === 'left' ? 'var(--blue)' : 'var(--red)')
	);

	// Avatar image - prefer GitHub avatar, then stored fields
	const avatarSrc = $derived(get_user_avatar_url(user, '/unknown.png'));
</script>

<div
	class="battler-progress"
	class:right={position === 'right'}
	style:--score-num={score}
>
	<div class="progress-track">
		<!-- Colored fill bar -->
		<div class="progress-fill" style:background-color={barColor}>
			<span class="score">{score}%</span>
		</div>
		<!-- Avatar positioned at progress point -->
		<div class="avatar-wrapper">
			<img src={avatarSrc} alt="{user.name}'s avatar" class="avatar" />
		</div>
	</div>
</div>

<style>
	.battler-progress {
		/* --score-num: 92 !important; override for testing */
		--battler-avatar-size: 36px;
		--score: calc(var(--score-num) * 1%);
		--min-display-width: 80px;
		--tack-limit: 69; /* At what % does the avatar go from overlapping the edge to being inset? */
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		/* Add padding to prevent avatar clipping at edges */
		padding: 0;
	}

	.score {
		font-size: 14px;
		display: inline-block;
		padding-inline: 8px;
		font-weight: bold;
	}

	.progress-track {
		position: relative;
		display: flex;
		flex: 1;
		height: 100%;
		background: var(--fg-2);
		--radius: 500px;
		border-radius: var(--radius);
		box-shadow: var(--shadow-2);
		justify-content: start;
		.right & {
			justify-content: end;
		}
	}

	.progress-fill {
		/* position: absolute; */
		top: 0;
		bottom: 0;
		width: var(--score);
		min-width: var(--min-display-width);
		border-radius: var(--radius);
		display: flex;
		align-items: center;
		justify-content: end;
		transition: width 0.3s ease-out;
	}

	/* Left position: fill from left */
	.battler-progress:not(.right) .progress-fill {
		left: 0;
		justify-content: start;
	}

	/* Right position: fill from right */
	.right .progress-fill {
		left: auto;
		right: 0;
	}

	.avatar-wrapper {
		position: absolute;
		top: 50%;
		z-index: 1;
		/* Fixed size to prevent shrinking */
		width: var(--battler-avatar-size);
		height: var(--battler-avatar-size);
		flex-shrink: 0;
		transition:
			left 0.3s ease-out,
			right 0.3s ease-out;
	}

	/* Left: avatar moves left-to-right based on progress */
	.battler-progress:not(.right) .avatar-wrapper {
		left: max(var(--min-display-width), var(--score));
		/* Step function: -50% when score < 22, -150% when score >= 22 */
		transform: translateY(-50%)
			translateX(
				calc(
					-50% - clamp(0%, (var(--score-num) - var(--tack-limit)) * 100%, 100%)
				)
			);
	}

	/* Right: avatar moves right-to-left based on progress */
	.right .avatar-wrapper {
		right: max(var(--min-display-width), var(--score));
		left: auto;
		/* Step function: 50% when score < 22, 150% when score >= 22 */
		transform: translateX(
				calc(
					50% + clamp(0%, (var(--score-num) - var(--tack-limit)) * 100%, 100%)
				)
			)
			translateY(-50%);
	}

	.avatar {
		width: var(--battler-avatar-size);
		height: var(--battler-avatar-size);
		min-width: var(--battler-avatar-size);
		min-height: var(--battler-avatar-size);
		border-radius: 50%;
		border: 2px solid var(--black);
		box-shadow: var(--shadow-2);
		object-fit: cover;
		display: block;
		background: var(--black);
		font-size: 0;
		background: white;
	}
</style>
