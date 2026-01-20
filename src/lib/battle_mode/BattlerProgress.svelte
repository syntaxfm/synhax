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

	// Default colors based on position (using Graffiti colors)
	const barColor = $derived(
		color ?? (position === 'left' ? 'var(--blue)' : 'var(--red)')
	);

	// Avatar image - prefer GitHub avatar, then stored fields
	const avatarSrc = $derived(get_user_avatar_url(user, '/unknown.png'));
</script>

<div class="battler-progress" class:right={position === 'right'}>
	<div class="progress-track">
		<!-- Colored fill bar -->
		<div
			class="progress-fill"
			style:width="{score}%"
			style:background-color={barColor}
		>
			<span class="score">{score}%</span>
		</div>
		<!-- Avatar positioned at progress point -->
		<div class="avatar-wrapper" style:--progress="{score}%">
			<img src={avatarSrc} alt="{user.name}'s avatar" class="avatar" />
		</div>
	</div>
</div>

<style>
	.battler-progress {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		/* Add padding to prevent avatar clipping at edges */
		padding: 0 20px;
	}

	.score {
		font-size: 14px;
		padding-inline: 8px;
		font-weight: bold;
	}

	.progress-track {
		position: relative;
		flex: 1;
		height: 20px;
		background: var(--fg-1);
		--radius: 500px;
		border-radius: var(--radius);
		box-shadow: var(--shadow-2);
	}

	.progress-fill {
		position: absolute;
		top: 0;
		bottom: 0;
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
		width: 36px;
		height: 36px;
		flex-shrink: 0;
		transition:
			left 0.3s ease-out,
			right 0.3s ease-out;
	}

	/* Left: avatar moves left-to-right based on progress */
	.battler-progress:not(.right) .avatar-wrapper {
		left: var(--progress);
		transform: translateX(-50%) translateY(-50%);
	}

	/* Right: avatar moves right-to-left based on progress */
	.right .avatar-wrapper {
		right: var(--progress);
		left: auto;
		transform: translateX(50%) translateY(-50%);
	}

	.avatar {
		width: 36px;
		height: 36px;
		min-width: 36px;
		min-height: 36px;
		border-radius: 50%;
		border: 2px solid var(--black);
		box-shadow: var(--shadow-2);
		object-fit: cover;
		display: block;
	}
</style>
