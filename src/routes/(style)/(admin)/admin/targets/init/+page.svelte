<script lang="ts">
	import { get_z } from '$lib/z';
	import { goto } from '$app/navigation';
	import TargetForm, { type Target } from '../TargetForm.svelte';

	const z = get_z();

	let isLoading = $state(false);

	async function handleSubmit({ name, image, type, inspo }: Target) {
		isLoading = true;

		try {
			console.log('Creating target with data:', { name, image, type, inspo });
			console.log('User ID:', z.userID);

			if (!z.userID) {
				throw new Error('User is not authenticated. Please log in and try again.');
			}

			const now = Date.now();
			const targetData = {
				id: crypto.randomUUID(),
				name,
				image,
				type,
				inspo,
				created_by: z.userID,
				is_active: true,
				archived_at: null,
				last_updated_at: now,
				created_at: now,
				updated_at: now
			};

			console.log('Full target data:', targetData);

			// Create new target using zero-sync mutation
			const result = await z.mutate.targets.insert(targetData);

			console.log('Target created successfully:', result);

			// Small delay to ensure sync completes
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Redirect to targets list on success
			await goto('/admin/targets');
		} catch (error) {
			console.error('Error creating target:', error);
			console.error('Error details:', JSON.stringify(error, null, 2));
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error. Check console for details.';
			alert(`Failed to create target: ${errorMessage}`);
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
