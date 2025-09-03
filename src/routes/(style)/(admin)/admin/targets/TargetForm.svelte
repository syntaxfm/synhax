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

	// Upload state
	let image_uploading = $state(false);
	let image_dragging = $state(false);
	let video_uploading = $state(false);
	let video_dragging = $state(false);
	let video_status = $state<string | null>(null);
	let video_error = $state<string | null>(null);
	let video_id = $state<string | null>(null);
	let video_raw_key = $state<string | null>(null);
	let video_content_type = $state<string | null>(null);
	let video_heartbeat = $state<string | null>(null);
	let image_error = $state<string | null>(null);
	let image_id = $state<string | null>(null);

	let image_input = $state<HTMLInputElement | null>(null);
	let video_input = $state<HTMLInputElement | null>(null);

	// Service thumbnail sprite (preferred)
	type ServiceThumbsMeta = {
		interval_s: number;
		tile_w: number;
		tile_h: number;
		cols: number;
		rows: number;
		count: number;
	};
	let service_thumbs = $state<{ sprite: string; meta: ServiceThumbsMeta } | null>(null);
	let auto_poster_selected = $state(false);

	// Client-side thumbnail capture (fallback)
	let thumbs = $state<string[]>([]);
	let thumbs_loading = $state(false);
	let thumb_error = $state<string | null>(null);

	async function loadHlsGlobal(): Promise<any | null> {
		if (typeof window === 'undefined') return null;
		const anyWin = window as any;
		if (anyWin.Hls) return anyWin.Hls;
		await new Promise<void>((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load HLS.js'));
			document.head.appendChild(script);
		});
		return (window as any).Hls || null;
	}

	async function generateThumbnails() {
		thumb_error = null;
		thumbs = [];
		if (!inspo) {
			thumb_error = 'Upload or set video first';
			return;
		}
		thumbs_loading = true;
		try {
			const video = document.createElement('video');
			video.crossOrigin = 'anonymous';
			video.muted = true;
			video.playsInline = true;
			video.preload = 'auto';

			const canNativeHls = video.canPlayType('application/vnd.apple.mpegurl');
			if (canNativeHls) {
				video.src = inspo;
				await new Promise((res, rej) => {
					video.addEventListener('loadedmetadata', () => res(null), { once: true });
					video.addEventListener('error', () => rej(new Error('Failed to load video metadata')), {
						once: true
					});
				});
			} else {
				const Hls = await loadHlsGlobal();
				if (!Hls || !Hls.isSupported()) throw new Error('HLS not supported in this browser');
				const hls = new Hls({});
				await new Promise((res, rej) => {
					const onErr = (_e: any, data: any) => {
						hls.off(Hls.Events.ERROR, onErr);
						rej(new Error(data?.details || 'HLS error'));
					};
					hls.on(Hls.Events.ERROR, onErr);
					hls.attachMedia(video);
					hls.loadSource(inspo);
					video.addEventListener(
						'loadedmetadata',
						() => {
							hls.off(Hls.Events.ERROR, onErr);
							res(null);
						},
						{ once: true }
					);
				});
			}

			const duration = video.duration;
			if (!isFinite(duration) || duration <= 0) throw new Error('Unable to read video duration');
			const samplePoints = [0.15, 0.5, 0.85].map((f) =>
				Math.max(0.1, Math.min(duration - 0.2, duration * f))
			);

			const captures: string[] = [];
			for (const t of samplePoints) {
				try {
					captures.push(await captureFrame(video, t));
				} catch (e) {
					console.warn('Frame capture failed at', t, e);
				}
			}
			thumbs = captures;
			if (!thumbs.length)
				throw new Error('Could not capture thumbnails. Try Safari or upload an image.');
		} catch (err: any) {
			thumb_error = err?.message || 'Failed to generate thumbnails';
		} finally {
			thumbs_loading = false;
		}
	}

	async function captureFrame(video: HTMLVideoElement, time: number): Promise<string> {
		await new Promise<void>((res, rej) => {
			const onSeeked = () => {
				video.removeEventListener('seeked', onSeeked);
				res();
			};
			const onError = () => {
				video.removeEventListener('error', onError);
				rej(new Error('Seek error'));
			};
			video.addEventListener('seeked', onSeeked, { once: true });
			video.addEventListener('error', onError, { once: true });
			video.currentTime = time;
		});
		// small delay to ensure frame paints
		await new Promise((r) => setTimeout(r, 100));
		const canvas = document.createElement('canvas');
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;
		const ctx = canvas.getContext('2d');
		if (!ctx) throw new Error('Canvas unsupported');
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		return canvas.toDataURL('image/jpeg', 0.9);
	}

	async function selectThumbnail(dataUrl: string) {
		try {
			const response = await fetch(dataUrl);
			const blob = await response.blob();
			const file = new File([blob], 'poster.jpg', { type: blob.type || 'image/jpeg' });
			await uploadImage(file);
		} catch (e) {
			image_error = 'Failed to set poster image';
		}
	}

	function spriteTileStyle(index: number) {
		if (!service_thumbs) return '';
		const { cols, tile_w, tile_h } = service_thumbs.meta;
		const col = index % cols;
		const row = Math.floor(index / cols);
		const x = -col * tile_w;
		const y = -row * tile_h;
		return `background-image:url(${service_thumbs.sprite});background-position:${x}px ${y}px;background-size:auto;`;
	}

	async function selectServiceSpriteTile(index: number) {
		if (!service_thumbs) return;
		try {
			// Render selected tile from sprite onto a canvas, then upload
			const img = new Image();
			img.crossOrigin = 'anonymous';
			await new Promise<void>((res, rej) => {
				img.onload = () => res();
				img.onerror = () => rej(new Error('Failed to load sprite'));
				img.src = service_thumbs!.sprite;
			});
			const { cols, tile_w, tile_h } = service_thumbs.meta;
			const col = index % cols;
			const row = Math.floor(index / cols);
			const sx = col * tile_w;
			const sy = row * tile_h;
			const canvas = document.createElement('canvas');
			canvas.width = tile_w;
			canvas.height = tile_h;
			const ctx = canvas.getContext('2d');
			if (!ctx) throw new Error('Canvas unsupported');
			ctx.drawImage(img, sx, sy, tile_w, tile_h, 0, 0, tile_w, tile_h);
			const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
			await selectThumbnail(dataUrl);
		} catch (e) {
			image_error = 'Failed to extract thumbnail tile';
		}
	}

	const APP_ID = 'synhax';

	function handleSubmit(e: Event) {
		e.preventDefault();

		if (!name || !image || !type || !inspo) {
			alert('Please fill out all fields');
			return;
		}

		onsubmit({ name, image, type, inspo });
	}

	function handleCancel() {
		oncancel();
	}

	async function uploadImage(file: File) {
		image_error = null;
		image_uploading = true;
		try {
			if (!image_id) image_id = crypto.randomUUID();
			const presignRes = await fetch('/api/uploads/image/presign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content_type: file.type, app_id: APP_ID, image_id })
			});
			if (!presignRes.ok) throw new Error('Failed to get image upload URL');
			const { upload_url, asset_url, transform_url } = await presignRes.json();

			const putRes = await fetch(upload_url, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file
			});
			if (!putRes.ok) throw new Error('Failed to upload image');

			image = transform_url || asset_url;
			// Auto-fill inspo for IMAGE targets if empty (prefer transform_url)
			if (type === 'IMAGE' && !inspo) {
				inspo = transform_url || asset_url;
			}
		} catch (err: any) {
			console.error(err);
			image_error = err?.message || 'Image upload failed';
		} finally {
			image_uploading = false;
		}
	}

	function onImageInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) uploadImage(file);
	}

	function onImageDrop(e: DragEvent) {
		e.preventDefault();
		image_dragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('image/')) uploadImage(file);
	}

	async function uploadVideo(file: File) {
		video_error = null;
		video_uploading = true;
		video_status = 'Preparing upload...';
		try {
			if (!video_id) video_id = crypto.randomUUID();
			const presignRes = await fetch('/api/uploads/video/presign', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content_type: file.type, app_id: APP_ID, video_id })
			});
			if (!presignRes.ok) throw new Error('Failed to get video upload URL');
			const { upload_url, raw_key } = await presignRes.json();
			video_raw_key = raw_key;
			video_content_type = file.type;

			video_status = 'Uploading...';
			const putRes = await fetch(upload_url, {
				method: 'PUT',
				headers: { 'Content-Type': file.type },
				body: file
			});
			if (!putRes.ok) throw new Error('Failed to upload video');

			video_status = 'Starting processing...';
			const notifyRes = await fetch('/api/uploads/video/notify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					raw_key,
					content_type: file.type,
					app_id: APP_ID,
					video_id
				})
			});
			if (!notifyRes.ok) throw new Error('Failed to notify processing');

			video_status = 'Processing...';
			const finalStatus = await pollUntilDone(APP_ID, video_id);
			video_heartbeat = new Date().toISOString();

			const playback = await fetch(
				`https://videos.break-code.com/playback-url?app_id=${APP_ID}&video_id=${video_id}`
			);
			if (!playback.ok) throw new Error('Failed to fetch playback URL');
			const { url } = await playback.json();
			inspo = url;

			if (finalStatus?.thumbnails?.sprite && finalStatus?.thumbnails?.meta) {
				service_thumbs = {
					sprite: finalStatus.thumbnails.sprite,
					meta: finalStatus.thumbnails.meta
				};
				if (!auto_poster_selected) {
					const mid = Math.floor((service_thumbs.meta.count - 1) / 2);
					selectServiceSpriteTile(mid);
					auto_poster_selected = true;
				}
			}
			video_status = 'Ready';
		} catch (err: any) {
			console.error(err);
			video_error = err?.message || 'Video upload failed';
			video_status = null;
		} finally {
			video_uploading = false;
		}
	}

	async function pollUntilDone(app_id: string, video_id: string) {
		for (;;) {
			const res = await fetch(
				`https://videos.break-code.com/job-status?app_id=${app_id}&video_id=${video_id}`
			);
			if (!res.ok) throw new Error('Failed to poll job status');
			const status = await res.json();
			video_heartbeat = status.heartbeat ?? null;
			if (status.status === 'done') return status;
			if (status.status === 'error') throw new Error(status.error || 'Transcode failed');
			await new Promise((r) => setTimeout(r, 5000));
		}
	}

	function isHeartbeatStale(heartbeat: string | null, maxMinutes = 5) {
		if (!heartbeat) return false;
		const ms = Date.now() - new Date(heartbeat).getTime();
		return ms > maxMinutes * 60 * 1000;
	}

	async function retryVideoProcessing() {
		try {
			if (!video_id || !video_raw_key || !video_content_type) {
				throw new Error('Missing video parameters to retry');
			}
			video_error = null;
			video_uploading = true;
			video_status = 'Restarting processing...';
			const notifyRes = await fetch('/api/uploads/video/notify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					raw_key: video_raw_key,
					content_type: video_content_type,
					app_id: APP_ID,
					video_id
				})
			});
			if (!notifyRes.ok) throw new Error('Failed to re-notify processing');

			video_status = 'Processing...';
			const finalStatus = await pollUntilDone(APP_ID, video_id);

			const playback = await fetch(
				`https://videos.break-code.com/playback-url?app_id=${APP_ID}&video_id=${video_id}`
			);
			if (!playback.ok) throw new Error('Failed to fetch playback URL');
			const { url } = await playback.json();
			inspo = url;

			if (finalStatus?.thumbnails?.sprite && finalStatus?.thumbnails?.meta) {
				service_thumbs = {
					sprite: finalStatus.thumbnails.sprite,
					meta: finalStatus.thumbnails.meta
				};
				if (!auto_poster_selected) {
					const mid = Math.floor((service_thumbs.meta.count - 1) / 2);
					selectServiceSpriteTile(mid);
					auto_poster_selected = true;
				}
			}
			video_status = 'Ready';
		} catch (err: any) {
			console.error(err);
			video_error = err?.message || 'Retry failed';
			video_status = null;
		} finally {
			video_uploading = false;
		}
	}

	function onVideoInputChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) uploadVideo(file);
	}

	function onVideoDrop(e: DragEvent) {
		e.preventDefault();
		video_dragging = false;
		const file = e.dataTransfer?.files?.[0];
		if (file && file.type.startsWith('video/')) uploadVideo(file);
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
		<label for="type">Target Type</label>
		<select id="type" bind:value={type} required disabled={isLoading}>
			<option value="">Select target type</option>
			<option value="CODE">Code</option>
			<option value="IMAGE">Image</option>
			<option value="VIDEO">Video</option>
		</select>
	</div>

	<div class="field">
		<label for="image-input">{type === 'VIDEO' ? 'Poster Image' : 'Target Image'}</label>
		<div
			class={`dropzone ${image_dragging ? 'dragging' : ''}`}
			role="button"
			tabindex="0"
			onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && image_input?.click()}
			ondragover={(e) => {
				e.preventDefault();
				image_dragging = true;
			}}
			ondragleave={() => (image_dragging = false)}
			ondrop={onImageDrop}
			onclick={() => image_input?.click()}
			aria-label="Upload image"
		>
			{#if image}
				<img src={image} alt="Target preview" class="preview" />
			{:else}
				<p>Drop image here, or click to select</p>
			{/if}
			<input
				id="image-input"
				bind:this={image_input}
				type="file"
				accept="image/*"
				class="hidden-input"
				onchange={onImageInputChange}
				disabled={isLoading || image_uploading}
			/>
		</div>
		{#if image_uploading}<small>Uploading image...</small>{/if}
		{#if image_error}<small class="error">{image_error}</small>{/if}
	</div>

	{#if type === 'VIDEO'}
		<div class="field">
			<label for="video-input">Video</label>
			<div
				class={`dropzone ${video_dragging ? 'dragging' : ''}`}
				role="button"
				tabindex="0"
				onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && video_input?.click()}
				ondragover={(e) => {
					e.preventDefault();
					video_dragging = true;
				}}
				ondragleave={() => (video_dragging = false)}
				ondrop={onVideoDrop}
				onclick={() => video_input?.click()}
				aria-label="Upload video"
			>
				<p>{video_status ?? 'Drop video here, or click to select'}</p>
				<input
					id="video-input"
					bind:this={video_input}
					type="file"
					accept="video/*"
					class="hidden-input"
					onchange={onVideoInputChange}
					disabled={isLoading || video_uploading}
				/>
			</div>
			{#if video_uploading && !video_status}<small>Uploading...</small>{/if}
			{#if video_error}
				<small class="error">{video_error}</small>
				<button
					class="go_button"
					type="button"
					onclick={retryVideoProcessing}
					disabled={video_uploading}
				>
					Retry Processing
				</button>
			{/if}
			{#if video_status === 'Processing...' && isHeartbeatStale(video_heartbeat)}
				<small class="error">Job is taking longer than expected.</small>
				<button
					class="go_button"
					type="button"
					onclick={retryVideoProcessing}
					disabled={video_uploading}
				>
					Retry Processing
				</button>
			{/if}

			{#if inspo}
				<div class="field">
					<div class="label">Poster From Video</div>
					{#if service_thumbs}
						<div
							class="thumbs-grid thumbs-sprite"
							style={`--tile-w:${service_thumbs.meta.tile_w}px; --tile-h:${service_thumbs.meta.tile_h}px;`}
							title="Click to set poster image"
						>
							{#each Array(service_thumbs.meta.count) as _, i}
								<button
									type="button"
									class="thumb tile"
									onclick={() => selectServiceSpriteTile(i)}
									style={spriteTileStyle(i)}
									aria-label={`Use tile ${i + 1} as poster`}
								></button>
							{/each}
						</div>
						<small>Using service thumbnails. Click any tile to set poster.</small>
					{:else}
						<div>
							<button
								class="go_button"
								type="button"
								onclick={generateThumbnails}
								disabled={thumbs_loading || video_uploading}
							>
								{thumbs_loading ? 'Generating...' : 'Generate Thumbnails'}
							</button>
							{#if thumb_error}<small class="error">{thumb_error}</small>{/if}
						</div>
						{#if thumbs_loading}<small>Scanning video and capturing frames...</small>{/if}
						{#if thumbs.length}
							<div class="thumbs-grid">
								{#each thumbs as t}
									<button
										type="button"
										class="thumb"
										onclick={() => selectThumbnail(t)}
										aria-label="Use this thumbnail as poster"
									>
										<img src={t} alt="Thumbnail option" />
									</button>
								{/each}
							</div>
							<small>Click a thumbnail to set the poster image.</small>
						{/if}
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if type === 'IMAGE' || type === 'VIDEO'}
		<div class="field">
			<label for="inspo">Inspiration</label>
			<input
				id="inspo"
				placeholder="Paste URL or upload above"
				bind:value={inspo}
				required
				disabled={isLoading}
			/>
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
	.dropzone {
		border: 2px dashed var(--border, #ccc);
		border-radius: 8px;
		padding: 16px;
		text-align: center;
		cursor: pointer;
	}
	.dropzone.dragging {
		border-color: var(--accent, #7b61ff);
		background: rgba(123, 97, 255, 0.08);
	}
	.hidden-input {
		display: none;
	}
	.preview {
		max-width: 260px;
		max-height: 160px;
		object-fit: cover;
		border-radius: 6px;
		border: 1px solid #ddd;
	}
	.error {
		color: #d33;
	}
	.thumbs-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 8px;
		margin-top: 8px;
	}
	.thumb {
		padding: 0;
		border: 1px solid #ccc;
		border-radius: 6px;
		background: transparent;
		cursor: pointer;
		overflow: hidden;
	}
	.thumb img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.thumbs-sprite {
		grid-template-columns: repeat(auto-fill, minmax(var(--tile-w), 1fr));
	}
	.tile {
		width: var(--tile-w);
		height: var(--tile-h);
		background-size: cover;
		background-repeat: no-repeat;
	}
</style>
