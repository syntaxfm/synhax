import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const APP_ID = 'synhax';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const video_id = (formData.get('video_id') as string | null) || crypto.randomUUID();

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Step 1: Get presigned URL
		const presignRes = await fetch('https://videos.break-code.com/generate-upload-url', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IV_API_KEY
			},
			body: JSON.stringify({
				app_id: APP_ID,
				video_id,
				content_type: file.type
			})
		});

		if (!presignRes.ok) {
			const error = await presignRes.text();
			return json({ error: 'Failed to get presigned URL', details: error }, { status: 500 });
		}

		const { upload_url, raw_key } = await presignRes.json();

		// Step 2: Upload file to R2 (server-side, no CORS issues)
		const uploadRes = await fetch(upload_url, {
			method: 'PUT',
			headers: {
				'Content-Type': file.type
			},
			body: await file.arrayBuffer()
		});

		if (!uploadRes.ok) {
			return json({ error: 'Failed to upload video to storage' }, { status: 500 });
		}

		// Step 3: Notify upload complete to start transcoding
		const notifyRes = await fetch('https://videos.break-code.com/notify-upload-complete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IV_API_KEY
			},
			body: JSON.stringify({
				app_id: APP_ID,
				video_id,
				raw_key,
				content_type: file.type
			})
		});

		if (!notifyRes.ok) {
			return json({ error: 'Failed to notify video upload' }, { status: 500 });
		}

		// Step 4: Return reference
		return json({
			raw_key,
			video_id,
			success: true
		});
	} catch (error) {
		console.error('Video upload error:', error);
		return json(
			{ error: 'Failed to upload video', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
