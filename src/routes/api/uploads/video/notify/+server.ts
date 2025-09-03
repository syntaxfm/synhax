import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

const APP_ID = 'synhax';

import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { raw_key, content_type, app_id, video_id } = (await request.json()) as {
			raw_key?: string;
			content_type?: string;
			app_id?: string;
			video_id?: string;
		};

		if (!raw_key || !content_type || !video_id) {
			return json({ error: 'raw_key, content_type, and video_id are required' }, { status: 400 });
		}

		const upstream = await fetch('https://videos.break-code.com/notify-upload-complete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IV_API_KEY
			},
			body: JSON.stringify({
				app_id: app_id || APP_ID,
				video_id,
				raw_key,
				content_type
			})
		});

		const text = await upstream.text();
		return new Response(text, {
			status: upstream.status,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		return json({ error: 'Failed to notify video upload complete' }, { status: 500 });
	}
};
