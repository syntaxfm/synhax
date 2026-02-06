<script lang="ts">
	import { customAlphabet } from 'nanoid';
	import { files } from '$lib/state/FileState.svelte';
	import { goto } from '$app/navigation';
	import { z, mutators, queries } from '$lib/zero.svelte';

	let { target_id } = $props();

	const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

	const soloAttempt = $derived(
		z.createQuery(
			queries.battles.mySoloAttemptForTarget({ targetId: target_id })
		)
	);

	const attemptHref = $derived.by(() => {
		const attempt = soloAttempt.data;
		if (!attempt?.id) return null;
		if (attempt.status === 'COMPLETED') return `/recap/${attempt.id}`;
		if (attempt.status === 'ACTIVE') return `/battle/${attempt.id}/code`;
		return `/lobby/${attempt.id}`;
	});

	let creating = $state(false);
	let createError = $state('');

	async function new_battle() {
		if (creating) return;
		createError = '';
		if (attemptHref) {
			goto(attemptHref);
			return;
		}

		const hasAccess =
			files.status === 'ACCESS' && files.synhax_directory_handle
				? true
				: await files.restore_directory_handle();
		if (!hasAccess || !files.synhax_directory_handle) {
			createError = 'File access is required before starting a battle.';
			return;
		}

		creating = true;
		const id = crypto.randomUUID();
		const participant_id = crypto.randomUUID();
		const hax_id = crypto.randomUUID();
		const zero_room_id = nanoid();
		const mutation = z.mutate(
			mutators.battles.create_solo({
				battle_id: id,
				participant_id,
				hax_id,
				zero_room_id,
				target_id
			})
		);

		try {
			await mutation.server;
			goto(`/lobby/${id}`);
		} catch (error) {
			createError = 'Failed to start battle. Please try again.';
			console.error('Failed to create solo battle:', error);
		} finally {
			creating = false;
		}
	}
</script>

<button onclick={new_battle} disabled={creating}>
	{#if creating}
		Starting...
	{:else if soloAttempt.data?.id}
		{soloAttempt.data.status === 'COMPLETED'
			? 'View Recap'
			: soloAttempt.data.status === 'ACTIVE'
				? 'Continue Battle'
				: 'Open Lobby'}
	{:else}
		Start Battle
	{/if}
</button>

{#if createError}
	<p class="error-message">{createError}</p>
{/if}

<style>
	.error-message {
		margin: var(--pad-s) 0 0;
		color: var(--red);
		font-size: 0.8rem;
		text-align: center;
	}
</style>
