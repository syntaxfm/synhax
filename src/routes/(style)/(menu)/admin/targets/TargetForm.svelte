<script lang="ts" module>
	export type Target = {
		name: string;
		image: string;
		type: 'CODE' | 'IMAGE' | 'VIDEO';
		inspo: string;
	};
</script>

<script lang="ts">
	import {
		parseTargetCode,
		serializeTargetCode,
		serializeTargetMedia
	} from '$utils/code';
	import AppFrame from '$lib/battle_mode/AppFrame.svelte';
	import {
		CSS_TEMPLATE,
		HTML_TEMPLATE,
		FRAME_WIDTH,
		FRAME_HEIGHT
	} from '$lib/constants';

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
			type: 'CODE',
			inspo: ''
		}
	}: Props = $props();

	const initialCode = parseTargetCode(initial_target.inspo);

	let name = $state(initial_target.name);
	let image = $state(initial_target.image);
	let type: 'CODE' | 'IMAGE' | 'VIDEO' = $state(initial_target.type);
	// For IMAGE/VIDEO: use url from parsed JSON, fallback to raw inspo for backward compat
	let inspo = $state(
		initial_target.type !== 'CODE'
			? initialCode.url || initial_target.inspo
			: initial_target.inspo
	);
	let code_html = $state(
		initial_target.type === 'CODE' ? initialCode.html : ''
	);
	let code_css = $state(initial_target.type === 'CODE' ? initialCode.css : '');
	// Starter code available for all target types
	let starter_html = $state(initialCode.starter_html);
	let starter_css = $state(initialCode.starter_css);

	// Preview data for AppFrame components
	let targetPreview = $derived({
		html: code_html || '',
		css: code_css || ''
	});
	let starterPreview = $derived({
		html: starter_html || HTML_TEMPLATE,
		css: starter_css || CSS_TEMPLATE
	});

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
			imageUploadError =
				error instanceof Error ? error.message : 'Upload failed';
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
			inspoUploadError =
				error instanceof Error ? error.message : 'Upload failed';
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

		const trimmedName = name.trim();
		const trimmedImage = image.trim();
		const trimmedInspo = inspo.trim();
		const trimmedHtml = code_html.trim();
		const trimmedCss = code_css.trim();
		const trimmedStarterHtml = starter_html.trim();
		const trimmedStarterCss = starter_css.trim();

		if (!trimmedName || !trimmedImage || !type) {
			alert('Please fill out all fields');
			return;
		}

		if (type === 'CODE') {
			if (!trimmedHtml && !trimmedCss) {
				alert('Please provide target HTML or CSS');
				return;
			}

			onsubmit({
				name: trimmedName,
				image: trimmedImage,
				type,
				inspo: serializeTargetCode(
					trimmedHtml,
					trimmedCss,
					trimmedStarterHtml,
					trimmedStarterCss
				)
			});
			return;
		}

		// IMAGE or VIDEO type
		if (!trimmedInspo) {
			alert('Please fill out all fields');
			return;
		}

		onsubmit({
			name: trimmedName,
			image: trimmedImage,
			type,
			inspo: serializeTargetMedia(
				trimmedInspo,
				trimmedStarterHtml,
				trimmedStarterCss
			)
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
			<label for="code-html">Target HTML</label>
			<textarea
				id="code-html"
				placeholder="HTML for the target body"
				bind:value={code_html}
				rows="6"
				disabled={isLoading}
			></textarea>
		</div>
		<div class="field">
			<label for="code-css">Target CSS</label>
			<textarea
				id="code-css"
				placeholder="CSS for the target (no <style> tags)"
				bind:value={code_css}
				rows="6"
				disabled={isLoading}
			></textarea>
		</div>

		{#if code_html || code_css}
			<div class="preview-section">
				<label>Target Preview</label>
				<div
					class="preview-frame"
					style="width: {FRAME_WIDTH}px; height: {FRAME_HEIGHT}px;"
				>
					<AppFrame hax={targetPreview} />
				</div>
			</div>
		{/if}
	{/if}

	<hr />
	<p class="field-hint">
		Starter code is optional. If provided, battlers will start with this code
		instead of the default template.
	</p>

	<div class="field">
		<label for="starter-html">Starter HTML (optional)</label>
		<textarea
			id="starter-html"
			placeholder="Initial HTML battlers start with (leave empty for default)"
			bind:value={starter_html}
			rows="4"
			disabled={isLoading}
		></textarea>
	</div>
	<div class="field">
		<label for="starter-css">Starter CSS (optional)</label>
		<textarea
			id="starter-css"
			placeholder="Initial CSS battlers start with (leave empty for default)"
			bind:value={starter_css}
			rows="4"
			disabled={isLoading}
		></textarea>
	</div>

	<div class="preview-section">
		<label>Starter Preview {starter_html || starter_css ? '' : '(default)'}</label>
		<div
			class="preview-frame"
			style="width: {FRAME_WIDTH}px; height: {FRAME_HEIGHT}px;"
		>
			<AppFrame hax={starterPreview} />
		</div>
	</div>

	<div class="form-actions">
		<button class="go_button" type="submit" disabled={isLoading}>
			{isLoading ? 'Saving...' : submitText}
		</button>
		<button
			class="go_button red"
			type="button"
			onclick={handleCancel}
			disabled={isLoading}
		>
			Cancel
		</button>
	</div>
</form>

<style>
	.status {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--fg-5);
	}

	.status.success {
		color: var(--green);
	}

	.error {
		margin-top: 0.5rem;
		font-size: 0.875rem;
		color: var(--red);
	}

	input[type='file'] {
		margin-bottom: 0.5rem;
	}

	.field-hint {
		font-size: 0.875rem;
		color: var(--fg-muted, #888);
		margin: 0;
	}

	.preview-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.preview-section label {
		font-weight: 500;
	}

	.preview-frame {
		border: 1px solid var(--border, #333);
		border-radius: 4px;
		overflow: hidden;
		background: #1a1a1a;
	}
</style>
