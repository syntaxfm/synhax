<script lang="ts">
	import { get_z } from '$lib/z';
	import { goto } from '$app/navigation';
	import TargetForm, { type Target } from '../../TargetForm.svelte';
	import { page } from '$app/state';
	import { Query } from 'zero-svelte';

	const z = get_z();

	let isLoading = $state(false);
	let target = new Query(
		z.query.targets.where('id', page?.params?.id || '').one()
	);

	async function handleSubmit({ name, image, type, inspo }: Target) {
		isLoading = true;

		try {
			if (page.params.id) {
				// Create new target using zero-sync mutation
				await z.mutate.targets.update({
					id: page.params.id,
					name,
					image,
					type,
					inspo,
					created_by: z.userID,
					is_active: true
				});
			}
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

<h1>Edit {target?.current?.name}</h1>

{#if target.current}
	<img
		src={target.current.image}
		alt={target.current.name}
		style="max-width: 500px; "
	/>

	<TargetForm
		submitText="Update Target"
		{isLoading}
		initial_target={target.current}
		onsubmit={handleSubmit}
		oncancel={handleCancel}
	/>
{/if}
