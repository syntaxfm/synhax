import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const APP_ID = 'synhax';
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const ALLOWED_VIDEO_TYPES = new Set([
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/quicktime',
	'video/x-matroska'
]);

function isAdmin(locals: App.Locals) {
	return locals.user?.role === 'syntax';
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!isAdmin(locals)) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const formData = await request.formData();
		const candidate = formData.get('file');
		if (!(candidate instanceof File)) {
			return json({ error: 'No file provided' }, { status: 400 });
		}
		const file = candidate;
		const video_id =
			(formData.get('video_id') as string | null) || crypto.randomUUID();

		if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
			return json({ error: 'Unsupported video type' }, { status: 415 });
		}

		if (file.size > MAX_VIDEO_BYTES) {
			return json({ error: 'Video file is too large' }, { status: 413 });
		}

		// Step 1: Get presigned URL
		const presignRes = await fetch(
			'https://videos.break-code.com/generate-upload-url',
			{
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
			}
		);

		if (!presignRes.ok) {
			return json({ error: 'Failed to get presigned URL' }, { status: 502 });
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
			return json(
				{ error: 'Failed to upload video to storage' },
				{ status: 502 }
			);
		}

		// Step 3: Notify upload complete to start transcoding
		const notifyRes = await fetch(
			'https://videos.break-code.com/notify-upload-complete',
			{
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
			}
		);

		if (!notifyRes.ok) {
			return json({ error: 'Failed to notify video upload' }, { status: 502 });
		}

		// Step 4: Return reference
		return json({
			raw_key,
			video_id,
			success: true
		});
	} catch (error) {
		console.error(
			'Video upload error:',
			error instanceof Error ? error.message : error
		);
		return json({ error: 'Failed to upload video' }, { status: 500 });
	}
};
