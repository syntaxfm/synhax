<script lang="ts">
	import { Combobox } from 'bits-ui';
	import { mutators, z } from '$lib/zero.svelte';

	type Props = {
		battle_id: string;
		existing_user_ids?: string[];
	};

	type SearchUser = {
		id: string;
		name: string;
		username: string | null;
		avatar: string | null;
		image: string | null;
	};

	const { battle_id, existing_user_ids = [] }: Props = $props();

	let search_value = $state('');
	let open = $state(false);
	let search_results: SearchUser[] = $state([]);
	let is_searching = $state(false);

	// Debounced search via server API
	let debounce_timer: number | undefined;

	function do_search(query: string) {
		// Clear any pending search
		if (debounce_timer) {
			clearTimeout(debounce_timer);
		}

		if (query.length < 1) {
			search_results = [];
			is_searching = false;
			return;
		}

		is_searching = true;

		debounce_timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
				if (res.ok) {
					const users: SearchUser[] = await res.json();
					// Filter out already-invited users
					search_results = users.filter((u) => !existing_user_ids.includes(u.id));
				}
			} catch (err) {
				console.error('User search failed:', err);
			} finally {
				is_searching = false;
			}
		}, 200) as unknown as number;
	}

	// Handler for input changes
	function on_input(e: Event) {
		const target = e.currentTarget as HTMLInputElement;
		search_value = target.value;
		do_search(target.value.trim());
	}

	let available_users = $derived(search_results);

	async function invite_user(user_id: string | undefined) {
		if (!user_id) return;

		// Calculate display order
		const usedOrders = new Set(existing_user_ids.map((_, i) => i));
		const displayOrder = usedOrders.has(0) ? 1 : 0;

		await z.mutate(
			mutators.battle_participants.invite({
				id: crypto.randomUUID(),
				battle_id,
				user_id,
				display_order: displayOrder
			})
		);

		// Clear the search after inviting
		search_value = '';
		open = false;
	}
</script>

<div class="invite-container">
	<Combobox.Root
		type="single"
		onOpenChangeComplete={(o) => {
			if (!o) search_value = '';
		}}
		onValueChange={(value) => {
			if (value) {
				invite_user(value);
			}
		}}
		bind:open
	>
		<div class="input-wrapper">
			<Combobox.Input
				oninput={on_input}
				class="combobox-input"
				placeholder="Search by username..."
				aria-label="Search for a player to invite"
			/>
			<Combobox.Trigger class="combobox-trigger">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="m7 15 5 5 5-5" />
					<path d="m7 9 5-5 5 5" />
				</svg>
			</Combobox.Trigger>
		</div>
		<Combobox.Content class="combobox-content" sideOffset={8}>
			<Combobox.Viewport class="combobox-viewport">
				{#if available_users.length > 0}
					{#each available_users as user (user.id)}
						<Combobox.Item
							class="combobox-item"
							value={user.id}
							label={user.username || user.name}
						>
							{#snippet children({ selected })}
								<span class="item-avatar">
									{#if user.avatar || user.image}
										<img src={user.avatar || user.image} alt="" />
									{:else}
										<span class="avatar-placeholder">{(user.username || user.name || '?')[0].toUpperCase()}</span>
									{/if}
								</span>
								<span class="item-label">{user.username || user.name}</span>
								{#if selected}
									<svg
										class="check-icon"
										xmlns="http://www.w3.org/2000/svg"
										width="16"
										height="16"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="2"
										stroke-linecap="round"
										stroke-linejoin="round"
									>
										<polyline points="20 6 9 17 4 12" />
									</svg>
								{/if}
							{/snippet}
						</Combobox.Item>
					{/each}
				{:else if search_value.length >= 1}
					<div class="no-results">No users found</div>
				{:else}
					<div class="no-results">Type to search for users</div>
				{/if}
			</Combobox.Viewport>
		</Combobox.Content>
	</Combobox.Root>
</div>

<style>
	.invite-container {
		max-width: 300px;
	}

	.input-wrapper {
		position: relative;
		display: flex;
		align-items: center;
	}

	.invite-container :global(.combobox-input) {
		width: 100%;
		height: 2.5rem;
		padding: 0 2.5rem 0 0.75rem;
		background: hsl(from var(--black) h s 8%);
		border: 1px solid rgb(255 255 255 / 0.1);
		border-radius: var(--br-s);
		color: var(--white);
		font-size: 0.875rem;
	}

	.invite-container :global(.combobox-input)::placeholder {
		color: var(--fg-muted);
	}

	.invite-container :global(.combobox-input):focus {
		outline: none;
		border-color: rgb(255 255 255 / 0.3);
	}

	.invite-container :global(.combobox-trigger) {
		position: absolute;
		right: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.25rem;
		background: transparent;
		border: none;
		color: var(--fg-muted);
		cursor: pointer;
	}

	.invite-container :global(.combobox-trigger):hover {
		color: var(--white);
	}

	:global(.combobox-content) {
		z-index: 50;
		min-width: 200px;
		max-height: 300px;
		overflow: hidden;
		background: hsl(from var(--black) h s 10%);
		border: 1px solid rgb(255 255 255 / 0.1);
		border-radius: var(--br-s);
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.5);
	}

	:global(.combobox-viewport) {
		padding: 0.25rem;
	}

	:global(.combobox-item) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-radius: var(--br-xs);
		color: var(--white);
		font-size: 0.875rem;
		cursor: pointer;
		user-select: none;
	}

	:global(.combobox-item[data-highlighted]) {
		background: rgb(255 255 255 / 0.1);
		outline: none;
	}

	:global(.combobox-item[data-selected]) {
		background: rgb(255 255 255 / 0.05);
	}

	.item-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		overflow: hidden;
		flex-shrink: 0;
		background: rgb(255 255 255 / 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.item-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-placeholder {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--fg-muted);
	}

	.item-label {
		flex: 1;
	}

	.check-icon {
		color: var(--accent, #4ade80);
	}

	.no-results {
		padding: 0.5rem 0.75rem;
		color: var(--fg-muted);
		font-size: 0.875rem;
		text-align: center;
	}
</style>
