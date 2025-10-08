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

	let imageUploading = $state(false);
	let imageUploadError = $state('');
	let inspoUploading = $state(false);
	let inspoUploadError = $state('');

	async function uploadImage(file: File): Promise<string> {
		imageUploading = true;
		imageUploadError = '';

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('image_id', crypto.randomUUID());

			const uploadRes = await fetch('/api/uploads/image/upload', {
				method: 'POST',
				body: formData
			});

			if (!uploadRes.ok) {
				const error = await uploadRes.json();
				throw new Error(error.error || 'Failed to upload image');
			}

			const { transform_url } = await uploadRes.json();
			return transform_url;
		} catch (error) {
			imageUploadError = error instanceof Error ? error.message : 'Upload failed';
			throw error;
		} finally {
			imageUploading = false;
		}
	}

	async function uploadVideo(file: File): Promise<string> {
		inspoUploading = true;
		inspoUploadError = '';

		try {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('video_id', crypto.randomUUID());

			const uploadRes = await fetch('/api/uploads/video/upload', {
				method: 'POST',
				body: formData
			});

			if (!uploadRes.ok) {
				const error = await uploadRes.json();
				throw new Error(error.error || 'Failed to upload video');
			}

			const { raw_key } = await uploadRes.json();
			return raw_key;
		} catch (error) {
			inspoUploadError = error instanceof Error ? error.message : 'Upload failed';
			throw error;
		} finally {
			inspoUploading = false;
		}
	}

	async function handleImageFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			try {
				image = await uploadImage(file);
			} catch (error) {
				console.error('Image upload failed:', error);
			}
		}
	}

	async function handleInspoFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) {
			try {
				if (type === 'IMAGE') {
					inspo = await uploadImage(file);
				} else if (type === 'VIDEO') {
					inspo = await uploadVideo(file);
				}
			} catch (error) {
				console.error('Inspo upload failed:', error);
			}
		}
	}

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
		<label for="image">Target Image</label>
		<input
			id="image-file"
			type="file"
			accept="image/*"
			onchange={handleImageFileChange}
			disabled={isLoading || imageUploading}
		/>
		{#if imageUploading}
			<p class="status">Uploading image...</p>
		{/if}
		{#if imageUploadError}
			<p class="error">{imageUploadError}</p>
		{/if}
		{#if image}
			<p class="status success">✓ Image uploaded</p>
			<input
				id="image"
				type="url"
				placeholder="Or enter image URL manually"
				bind:value={image}
				disabled={isLoading}
			/>
		{:else}
			<input
				id="image"
				type="url"
				placeholder="Or enter image URL manually"
				bind:value={image}
				disabled={isLoading}
			/>
		{/if}
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
	{#if type === 'IMAGE'}
		<div class="field">
			<label for="inspo">Inspiration Image</label>
			<input
				id="inspo-file"
				type="file"
				accept="image/*"
				onchange={handleInspoFileChange}
				disabled={isLoading || inspoUploading}
			/>
			{#if inspoUploading}
				<p class="status">Uploading inspiration image...</p>
			{/if}
			{#if inspoUploadError}
				<p class="error">{inspoUploadError}</p>
			{/if}
			{#if inspo}
				<p class="status success">✓ Inspiration uploaded</p>
				<input
					id="inspo"
					type="url"
					placeholder="Or enter image URL manually"
					bind:value={inspo}
					disabled={isLoading}
				/>
			{:else}
				<input
					id="inspo"
					type="url"
					placeholder="Or enter image URL manually"
					bind:value={inspo}
					disabled={isLoading}
				/>
			{/if}
		</div>
	{:else if type === 'VIDEO'}
		<div class="field">
			<label for="inspo">Inspiration Video</label>
			<input
				id="inspo-file"
				type="file"
				accept="video/*"
				onchange={handleInspoFileChange}
				disabled={isLoading || inspoUploading}
			/>
			{#if inspoUploading}
				<p class="status">Uploading video (this may take a moment)...</p>
			{/if}
			{#if inspoUploadError}
				<p class="error">{inspoUploadError}</p>
			{/if}
			{#if inspo}
				<p class="status success">✓ Video uploaded</p>
				<input
					id="inspo"
					type="url"
					placeholder="Or enter video URL manually"
					bind:value={inspo}
					disabled={isLoading}
				/>
			{:else}
				<input
					id="inspo"
					type="url"
					placeholder="Or enter video URL manually"
					bind:value={inspo}
					disabled={isLoading}
				/>
			{/if}
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

<style>
	.status {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--text-secondary, #666);
	}

	.status.success {
		color: var(--success, #22c55e);
	}

	.error {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--error, #ef4444);
	}

	input[type='file'] {
		margin-bottom: 0.5rem;
	}
</style>
