<script lang="ts">
	import { z, queries, mutators } from '$lib/zero.svelte';
	import { goto } from '$app/navigation';
	import TargetForm, { type Target } from '../../TargetForm.svelte';
	import { page } from '$app/state';

	let isLoading = $state(false);
	let target = $derived(
		z.createQuery(queries.targets.byId({ id: page?.params?.id || '' }))
	);

	async function handleSubmit({ name, image, type, inspo }: Target) {
		isLoading = true;

		try {
			if (page.params.id) {
				// Update target using zero-sync mutation
				await z.mutate(
					mutators.targets.update({
						id: page.params.id,
						name,
						image,
						type,
						inspo,
						is_active: true
					})
				).server;
			}
		} catch (error) {
			console.error('Error updating target:', error);
			alert('Failed to update target. Please try again.');
		} finally {
			isLoading = false;
		}
	}

	function handleCancel() {
		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Edit {target?.data?.name ?? 'Target'} | Admin - Synhax</title>
</svelte:head>

<h1>Edit {target?.data?.name}</h1>

{#if target.data}
	<img
		src={target.data.image}
		alt={target.data.name}
		style="max-width: 500px; "
	/>

	<TargetForm
		submitText="Update Target"
		{isLoading}
		initial_target={target.data}
		onsubmit={handleSubmit}
		oncancel={handleCancel}
	/>
{/if}
