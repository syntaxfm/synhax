import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

const APP_ID = 'synhax';
const ALLOWED_VIDEO_TYPES = new Set([
	'video/mp4',
	'video/webm',
	'video/ogg',
	'video/quicktime',
	'video/x-matroska'
]);

import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (locals.user?.role !== 'syntax') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const { content_type, video_id, app_id } = (await request.json()) as {
			content_type?: string;
			video_id?: string;
			app_id?: string;
		};

		if (!content_type) {
			return json({ error: 'content_type is required' }, { status: 400 });
		}

		if (!ALLOWED_VIDEO_TYPES.has(content_type)) {
			return json({ error: 'Unsupported video type' }, { status: 415 });
		}

		const upstream = await fetch(
			'https://videos.break-code.com/generate-upload-url',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': IV_API_KEY
				},
				body: JSON.stringify({
					app_id: app_id || APP_ID,
					video_id,
					content_type
				})
			}
		);

		const text = await upstream.text();
		return new Response(text, {
			status: upstream.status,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return json({ error: 'Failed to presign video upload' }, { status: 500 });
	}
};
