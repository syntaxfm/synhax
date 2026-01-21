<script lang="ts">
	import { page } from '$app/state';
	import { z, queries } from '$lib/zero.svelte';
	import { get_user_avatar_url } from '$lib/user/utils';
	import BattleCard from '$lib/targets/BattleCard.svelte';

	let user = $derived(
		z.createQuery(queries.user.byId({ id: page?.params?.id || '' }))
	);

	// Extract unique battles from participants
	let userBattles = $derived.by(() => {
		if (!user.data?.participants) return [];

		// Get unique battles and map them to the format BattleCard expects
		const battlesMap = new Map<
			string,
			{
				id: string;
				battle: NonNullable<(typeof user.data.participants)[number]['battle']>;
			}
		>();

		for (const participant of user.data.participants) {
			if (participant.battle && !battlesMap.has(participant.battle.id)) {
				battlesMap.set(participant.battle.id, {
					id: participant.battle.id,
					battle: participant.battle
				});
			}
		}

		return Array.from(battlesMap.values()).map((b) => b.battle);
	});

	// Format date helper
	function formatDate(timestamp: number | null | undefined): string {
		if (!timestamp) return 'N/A';
		return new Date(timestamp).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>{user.data?.name ?? 'User'} | Admin - Synhax</title>
</svelte:head>

{#if user.data}
	{@const userData = user.data}
	<div class="stack" style:--gap="40px;">
		<a href="/admin/users" class="back-link">← Back to Users</a>

		<!-- User Profile Header -->
		<header class="user-header">
			<div class="avatar-section">
				<img
					src={get_user_avatar_url(userData, '/unknown.png')}
					alt={userData.name}
					class="user-avatar"
				/>
				{#if userData.banned}
					<span class="banned-overlay">🚫 BANNED</span>
				{/if}
			</div>

			<div class="user-info">
				<h1 class="game-title">{userData.name}</h1>
				{#if userData.username}
					<p class="username">@{userData.username}</p>
				{/if}
				<p class="email">{userData.email}</p>

				<div class="badges">
					{#if userData.role}
						<span class="role-badge {userData.role.toLowerCase()}"
							>{userData.role}</span
						>
					{:else}
						<span class="role-badge user">user</span>
					{/if}

					{#if userData.emailVerified}
						<span class="verified-badge verified">✓ Verified</span>
					{:else}
						<span class="verified-badge unverified">✗ Unverified</span>
					{/if}
				</div>
			</div>
		</header>

		<!-- User Details -->
		<section class="details-section">
			<h2 class="game-title">Details</h2>
			<div class="details-grid">
				<div class="detail-item">
					<span class="detail-label">User ID</span>
					<span class="detail-value mono">{userData.id}</span>
				</div>
				<div class="detail-item">
					<span class="detail-label">Created</span>
					<span class="detail-value">{formatDate(userData.createdAt)}</span>
				</div>
				<div class="detail-item">
					<span class="detail-label">Last Updated</span>
					<span class="detail-value">{formatDate(userData.updatedAt)}</span>
				</div>
				{#if userData.bio}
					<div class="detail-item full-width">
						<span class="detail-label">Bio</span>
						<span class="detail-value">{userData.bio}</span>
					</div>
				{/if}
				{#if userData.theme}
					<div class="detail-item">
						<span class="detail-label">Theme</span>
						<span class="detail-value">{userData.theme}</span>
					</div>
				{/if}
			</div>
		</section>

		<!-- Ban Info (if banned) -->
		{#if userData.banned}
			<section class="ban-section">
				<h2 class="game-title">🚫 Ban Information</h2>
				<div class="details-grid">
					{#if userData.banReason}
						<div class="detail-item full-width">
							<span class="detail-label">Reason</span>
							<span class="detail-value">{userData.banReason}</span>
						</div>
					{/if}
					{#if userData.banExpires}
						<div class="detail-item">
							<span class="detail-label">Expires</span>
							<span class="detail-value">{formatDate(userData.banExpires)}</span
							>
						</div>
					{/if}
				</div>
			</section>
		{/if}

		<!-- User's Battles -->
		<section class="battles-section">
			<h2 class="game-title">Battles ({userBattles.length})</h2>
			{#if userBattles.length > 0}
				<div class="battles-grid">
					{#each userBattles as battle (battle.id)}
						<BattleCard {battle} />
					{/each}
				</div>
			{:else}
				<p class="empty-state">
					This user has not participated in any battles yet.
				</p>
			{/if}
		</section>

		<!-- User's Hax -->
		<section class="hax-section">
			<h2 class="game-title">Hax Submissions ({userData.hax?.length ?? 0})</h2>
			{#if userData.hax && userData.hax.length > 0}
				<div class="hax-grid">
					{#each userData.hax as hax (hax.id)}
						<div class="hax-card">
							<div class="hax-header">
								<span class="hax-type {hax.type.toLowerCase()}">{hax.type}</span
								>
								{#if hax.diff_score !== null && hax.diff_score !== undefined}
									<span class="hax-score">{Math.round(hax.diff_score)}%</span>
								{/if}
							</div>
							<div class="hax-info">
								{#if hax.target}
									<p class="hax-target">
										Target: <strong>{hax.target.name}</strong>
									</p>
								{/if}
								{#if hax.battle}
									<a href="/recap/{hax.battle.id}" class="hax-battle-link">
										View Battle →
									</a>
								{/if}
							</div>
							<div class="hax-meta">
								{#if hax.is_final}
									<span class="final-badge">Final</span>
								{/if}
								{#if hax.submitted_at}
									<span class="hax-date"
										>Submitted {formatDate(hax.submitted_at)}</span
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="empty-state">This user has not submitted any hax yet.</p>
			{/if}
		</section>
	</div>
{:else}
	<div class="loading">Loading user data...</div>
{/if}

<style>
	.back-link {
		color: var(--slate);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back-link:hover {
		color: var(--yellow);
	}

	.user-header {
		display: flex;
		gap: 24px;
		align-items: flex-start;
		padding: 24px;
		background: var(--surface-0);
		border-radius: var(--br-l);
		border: 1px solid var(--border-subtle);
	}

	.avatar-section {
		position: relative;
		flex-shrink: 0;
	}

	.user-avatar {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--border-subtle);
	}

	.banned-overlay {
		position: absolute;
		bottom: 0;
		left: 50%;
		transform: translateX(-50%);
		background: var(--red, #ff4444);
		color: white;
		font-size: 10px;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 999px;
		white-space: nowrap;
	}

	.user-info {
		flex: 1;
	}

	.user-info h1 {
		margin: 0 0 4px;
		font-size: 1.75rem;
	}

	.username {
		color: var(--teal);
		margin: 0 0 4px;
		font-size: 1rem;
	}

	.email {
		color: var(--slate);
		margin: 0 0 12px;
	}

	.badges {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.role-badge {
		display: inline-block;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 4px 10px;
		border-radius: 999px;
		background: var(--surface-0);
	}

	.role-badge.syntax {
		border: 1px solid var(--pink);
		color: var(--pink);
	}

	.role-badge.user {
		border: 1px solid var(--border-default);
		color: var(--slate);
	}

	.verified-badge {
		display: inline-block;
		font-size: 10px;
		font-weight: 600;
		padding: 4px 10px;
		border-radius: 999px;
	}

	.verified-badge.verified {
		color: var(--green);
		background: rgb(34 197 94 / 0.15);
		border: 1px solid rgb(34 197 94 / 0.3);
	}

	.verified-badge.unverified {
		color: var(--slate);
		background: var(--surface-0);
		border: 1px solid var(--border-subtle);
	}

	h2 {
		font-size: 1.25rem;
		margin: 0 0 16px;
		color: var(--white);
	}

	.details-section,
	.ban-section,
	.battles-section,
	.hax-section {
		padding: 20px;
		background: var(--surface-0);
		border-radius: var(--br-m);
		border: 1px solid var(--border-subtle);
	}

	.ban-section {
		border-color: rgb(255 68 68 / 0.3);
		background: rgb(255 68 68 / 0.05);
	}

	.details-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		gap: 16px;
	}

	.detail-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-item.full-width {
		grid-column: 1 / -1;
	}

	.detail-label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--slate);
	}

	.detail-value {
		color: var(--white);
	}

	.detail-value.mono {
		font-family: var(--font-mono, monospace);
		font-size: 0.875rem;
		word-break: break-all;
	}

	.battles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 20px;
	}

	.hax-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	.hax-card {
		padding: 16px;
		background: var(--surface-1);
		border-radius: var(--br-m);
		border: 1px solid var(--border-subtle);
	}

	.hax-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
	}

	.hax-type {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		padding: 3px 8px;
		border-radius: 999px;
		background: rgb(0 0 0 / 0.4);
	}

	.hax-type.battle {
		border: 1px solid var(--pink);
		color: var(--pink);
	}

	.hax-type.solo {
		border: 1px solid var(--teal);
		color: var(--teal);
	}

	.hax-score {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--green);
	}

	.hax-info {
		margin-bottom: 12px;
	}

	.hax-target {
		margin: 0 0 8px;
		color: var(--slate);
	}

	.hax-target strong {
		color: var(--white);
	}

	.hax-battle-link {
		color: var(--yellow);
		text-decoration: none;
		font-size: 0.875rem;
	}

	.hax-battle-link:hover {
		text-decoration: underline;
	}

	.hax-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.final-badge {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--green);
		color: var(--black);
	}

	.hax-date {
		font-size: 0.75rem;
		color: var(--slate);
	}

	.empty-state {
		color: var(--slate);
		font-style: italic;
		text-align: center;
		padding: 32px;
	}

	.loading {
		text-align: center;
		padding: 64px;
		color: var(--slate);
	}
</style>
