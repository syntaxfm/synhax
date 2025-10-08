import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const APP_ID = 'synhax';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const file = formData.get('file') as File;
		const image_id = formData.get('image_id') as string | null;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Step 1: Get presigned URL
		const presignRes = await fetch('https://assets.break-code.com/generate-image-upload-url', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': IV_API_KEY
			},
			body: JSON.stringify({
				app_id: APP_ID,
				image_id: image_id || crypto.randomUUID(),
				content_type: file.type
			})
		});

		if (!presignRes.ok) {
			const error = await presignRes.text();
			return json({ error: 'Failed to get presigned URL', details: error }, { status: 500 });
		}

		const { upload_url, transform_url, asset_url } = await presignRes.json();

		// Step 2: Upload file to R2 (server-side, no CORS issues)
		const uploadRes = await fetch(upload_url, {
			method: 'PUT',
			headers: {
				'Content-Type': file.type
			},
			body: await file.arrayBuffer()
		});

		if (!uploadRes.ok) {
			return json({ error: 'Failed to upload image to storage' }, { status: 500 });
		}

		// Step 3: Return URLs
		return json({
			transform_url,
			asset_url,
			success: true
		});
	} catch (error) {
		console.error('Image upload error:', error);
		return json(
			{ error: 'Failed to upload image', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};
