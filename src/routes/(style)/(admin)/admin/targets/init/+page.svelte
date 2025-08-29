<script lang="ts">
	import { z } from '$sync/client';
	import { goto } from '$app/navigation';

	import TargetForm, { type Target } from '../TargetForm.svelte';

	let isLoading = $state(false);

	async function handleSubmit({ name, image, type, inspo }: Target) {
		isLoading = true;

		try {
			// Create new target using zero-sync mutation
			await z.current.mutate.targets.insert({
				id: crypto.randomUUID(),
				name,
				image,
				type,
				inspo,
				created_by: z.current.userID,
				is_active: true
			});

			// Redirect to dashboard on success
			goto('/dashboard');
		} catch (error) {
			console.error('Error creating target:', error);
			alert('Failed to create target. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/dashboard');
	}
</script>

<h1>Create New Target</h1>

<TargetForm
	submitText="Create Target"
	{isLoading}
	onsubmit={handleSubmit}
	oncancel={handleCancel}
/>
