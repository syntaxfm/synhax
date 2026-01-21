<script lang="ts">
	import { z, mutators } from '$lib/zero.svelte';
	import { goto } from '$app/navigation';
	import TargetForm, { type Target } from '../TargetForm.svelte';

	let isLoading = $state(false);

	async function handleSubmit({ name, image, type, inspo }: Target) {
		isLoading = true;

		try {
			if (!z.userID) {
				throw new Error(
					'User is not authenticated. Please log in and try again.'
				);
			}

			const targetId = crypto.randomUUID();

			// Create new target using zero-sync mutation (admin-only, enforced server-side)
			await z.mutate(
				mutators.targets.insert({
					id: targetId,
					name,
					image,
					type,
					inspo,
					created_by: z.userID
				})
			).server;

			// Redirect to targets list on success
			await goto('/admin/targets');
		} catch (error) {
			console.error('Error creating target:', error);
			const errorMessage =
				error instanceof Error
					? error.message
					: 'Unknown error. Check console for details.';
			alert(`Failed to create target: ${errorMessage}`);
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Create Target | Admin - Synhax</title>
</svelte:head>

<h1>Create New Target</h1>

<TargetForm
	submitText="Create Target"
	{isLoading}
	onsubmit={handleSubmit}
	oncancel={handleCancel}
/>
