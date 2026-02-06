<script lang="ts">
	import { goto } from '$app/navigation';
	import { customAlphabet } from 'nanoid';
	import { mutators, queries, z } from '$lib/zero.svelte';

	let { target_id }: { target_id: string } = $props();

	const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

	const soloAttempt = $derived(
		z.createQuery(
			queries.battles.mySoloAttemptForTarget({ targetId: target_id })
		)
	);

	let isCreating = $state(false);
	let errorMessage = $state('');

	type SoloAttemptWithRelations = {
		id: string;
		status: 'PENDING' | 'READY' | 'ACTIVE' | 'COMPLETED' | null;
		participants?:
			| readonly {
					user_id: string;
					hax?: { diff_score?: number | null } | null;
			  }[]
			| null;
	};

	const attemptData = $derived(
		(soloAttempt.data as unknown as
			| SoloAttemptWithRelations
			| null
			| undefined) ?? null
	);

	const participant = $derived.by(() => {
		if (!attemptData?.participants?.length) return null;
		return (
			attemptData.participants.find((p) => p.user_id === z.userID) ??
			attemptData.participants[0]
		);
	});

	const attemptScore = $derived(participant?.hax?.diff_score ?? null);

	const continueHref = $derived.by(() => {
		const attempt = attemptData;
		if (!attempt?.id) return null;
		if (attempt.status === 'PENDING') return `/lobby/${attempt.id}`;
		if (attempt.status === 'ACTIVE') return `/battle/${attempt.id}/code`;
		if (attempt.status === 'COMPLETED') return `/recap/${attempt.id}`;
		return `/lobby/${attempt.id}`;
	});

	async function startSoloChallenge() {
		if (isCreating || !target_id) return;
		isCreating = true;
		errorMessage = '';

		const battle_id = crypto.randomUUID();
		const participant_id = crypto.randomUUID();
		const hax_id = crypto.randomUUID();
		const zero_room_id = nanoid();

		const mutation = z.mutate(
			mutators.battles.create_solo({
				battle_id,
				participant_id,
				hax_id,
				zero_room_id,
				target_id
			})
		);

		try {
			await mutation.server;
			goto(`/lobby/${battle_id}`);
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			if (message.toLowerCase().includes('already have a solo challenge')) {
				errorMessage =
					'You already have a solo challenge for this target. Continue your existing run.';
			} else {
				errorMessage = 'Could not start solo challenge. Please try again.';
			}
		} finally {
			isCreating = false;
		}
	}
</script>

{#if attemptData?.id}
	{#if attemptData.status === 'COMPLETED'}
		<a class="button" href={continueHref ?? '#'}>
			View Solo Recap
			{#if attemptScore !== null}
				<span class="score">{Math.round(attemptScore)}%</span>
			{/if}
		</a>
	{:else}
		<a class="button" href={continueHref ?? '#'}>
			{attemptData.status === 'ACTIVE'
				? 'Continue Solo Challenge'
				: 'Enter Solo Lobby'}
		</a>
	{/if}
{:else}
	<button onclick={startSoloChallenge} disabled={isCreating}>
		{isCreating ? 'Starting Solo...' : 'Start Solo Challenge'}
	</button>
{/if}

{#if errorMessage}
	<p class="solo-error">{errorMessage}</p>
{/if}

<style>
	.score {
		margin-left: var(--pad-s);
		font-size: 0.8em;
		opacity: 0.9;
	}

	.solo-error {
		margin: var(--pad-s) 0 0;
		font-size: 0.8rem;
		color: var(--red);
		text-align: center;
	}
</style>
