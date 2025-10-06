<script lang="ts" module>
	export type Target = {
		name: string;
		image: string;
		type: 'CODE' | 'IMAGE' | 'VIDEO';
		inspo: string;
	};
</script>

<script lang="ts">
	type Props = {
		submitText?: string;
		isLoading?: boolean;
		onsubmit: ({ name, image, type, inspo }: Target) => void;
		oncancel: () => void;
		initial_target?: Target;
	};

	let {
		submitText = 'Create Target',
		isLoading = false,
		oncancel,
		onsubmit,
		initial_target = {
			name: '',
			image: '',
			type: 'IMAGE',
			inspo: ''
		}
	}: Props = $props();

	let name = $state(initial_target.name);
	let image = $state(initial_target.image);
	let type: 'CODE' | 'IMAGE' | 'VIDEO' = $state(initial_target.type);
	let inspo = $state(initial_target.inspo);

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!name || !image || !type || !inspo) {
			alert('Please fill out all fields');
			return;
		}

		onsubmit({
			name,
			image,
			type,
			inspo
		});
	}

	function handleCancel() {
		oncancel();
	}
</script>

<form onsubmit={handleSubmit} class="stack">
	<div class="field">
		<label for="name">Target Name</label>
		<input
			id="name"
			type="text"
			placeholder="Enter target name"
			bind:value={name}
			required
			disabled={isLoading}
		/>
	</div>

	<div class="field">
		<label for="image">Image URL</label>
		<input
			id="image"
			type="url"
			placeholder="Enter image URL"
			bind:value={image}
			required
			disabled={isLoading}
		/>
	</div>

	<div class="field">
		<label for="type">Target Type</label>
		<select id="type" bind:value={type} required disabled={isLoading}>
			<option value="">Select target type</option>
			<option value="CODE">Code</option>
			<option value="IMAGE">Image</option>
			<option value="VIDEO">Video</option>
		</select>
	</div>
	<!-- TODO make this an uploader -->
	{#if type === 'IMAGE' || type === 'VIDEO'}
		<div class="field">
			<label for="inspo">Inspiration</label>
			<input id="inspo" placeholder="Paste URL" bind:value={inspo} required disabled={isLoading} />
		</div>
	{:else}
		<div class="field">
			<label for="inspo">Inspiration</label>
			<textarea
				id="inspo"
				placeholder="Paste code snippet"
				bind:value={inspo}
				rows="4"
				required
				disabled={isLoading}
			></textarea>
		</div>
	{/if}

	<div class="form-actions">
		<button class="go_button" type="submit" disabled={isLoading}>
			{isLoading ? 'Saving...' : submitText}
		</button>
		<button class="go_button red" type="button" onclick={handleCancel} disabled={isLoading}>
			Cancel
		</button>
	</div>
</form>
