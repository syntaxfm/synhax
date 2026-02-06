import { IV_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const APP_ID = 'synhax';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/avif'
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
		const image_id = formData.get('image_id') as string | null;

		if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
			return json({ error: 'Unsupported image type' }, { status: 415 });
		}

		if (file.size > MAX_IMAGE_BYTES) {
			return json({ error: 'Image file is too large' }, { status: 413 });
		}

		// Step 1: Get presigned URL
		const presignRes = await fetch(
			'https://assets.break-code.com/generate-image-upload-url',
			{
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
			}
		);

		if (!presignRes.ok) {
			return json({ error: 'Failed to get presigned URL' }, { status: 502 });
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
			return json(
				{ error: 'Failed to upload image to storage' },
				{ status: 502 }
			);
		}

		// Step 3: Return URLs
		return json({
			transform_url,
			asset_url,
			success: true
		});
	} catch (error) {
		console.error(
			'Image upload error:',
			error instanceof Error ? error.message : error
		);
		return json({ error: 'Failed to upload image' }, { status: 500 });
	}
};
