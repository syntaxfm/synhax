import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';

const APP_ID = 'synhax';

export async function POST({ request }: { request: Request }) {
	try {
		const { content_type, image_id, app_id } = (await request.json()) as {
			content_type?: string;
			image_id?: string;
			app_id?: string;
		};

		if (!content_type) {
			return json({ error: 'content_type is required' }, { status: 400 });
		}

		const upstream = await fetch('https://assets.break-code.com/generate-image-upload-url', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IV_API_KEY
			},
			body: JSON.stringify({
				app_id: app_id || APP_ID,
				image_id,
				content_type
			})
		});

		const text = await upstream.text();
		return new Response(text, {
			status: upstream.status,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (e) {
		return json({ error: 'Failed to presign image upload' }, { status: 500 });
	}
}
