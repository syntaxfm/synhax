<script lang="ts">
	import { z } from '$lib/zero.svelte';
	import { goto } from '$app/navigation';
	import TargetForm, { type Target } from '../TargetForm.svelte';

	let isLoading = $state(false);

	async function handleSubmit({ name, image, type, inspo }: Target) {
		isLoading = true;

		try {
			console.log('Creating target with data:', { name, image, type, inspo });
			console.log('User ID:', z.userID);
			console.log('Zero connection status:', z);

			if (!z.userID) {
				throw new Error('User is not authenticated. Please log in and try again.');
			}

			const now = Date.now();
			const targetId = crypto.randomUUID();
			const targetData = {
				id: targetId,
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

			// Wait for sync to propagate
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Verify the target was created by querying for it
			const verifyTarget = await z.query.targets.where('id', targetId).one();
			console.log('Verification query result:', verifyTarget);

			if (!verifyTarget) {
				throw new Error(
					'Target mutation succeeded but target not found in database. This may be a Zero Sync issue.'
				);
			}

			console.log('Target verified in database, redirecting...');

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
