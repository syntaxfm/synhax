<script lang="ts">
	import { generateAvatar } from '$lib/user/avatar.remote';
	import Logout from '$lib/user/Logout.svelte';
	import { get_z } from '$lib/z';
	import { Query } from 'zero-svelte';
	const z = get_z();
	// - WHEN user is ID
	// - CAN Change Theme
	// - CAN Logout
	// - CAN change ~~character~~
	// - WHEN user is NOT ID
	// - CANNOT access
	const user = new Query(z.query.user.where('id', z.userID).one());

	let isGenerating = $state(false);
	let error = $state('');

	async function handleGenerate() {
		isGenerating = true;
		error = '';
		try {
			await generateAvatar();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate avatar';
		} finally {
			isGenerating = false;
		}
	}
</script>

<a href="/" class="button">Back</a>
<div class="stack">
	<h1>Settings</h1>
	<img src={user.current?.avatar} alt="{user.current?.name} Avatar" />
	{#if error}
		<p class="error">{error}</p>
	{/if}
	<p>
		<button
			onclick={handleGenerate}
			disabled={isGenerating}
			class="generate-btn"
		>
			{isGenerating ? 'Generating...' : 'Generate Avatar'}
		</button>
	</p>
	<Logout />
</div>

<style>
	img {
		width: 300px;
	}
</style>
