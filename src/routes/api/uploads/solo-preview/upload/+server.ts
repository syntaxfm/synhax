import { createDb } from '$db';
import { hax } from '$db/schema';
import { IV_API_KEY } from '$env/static/private';
import { and, eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

const APP_ID = 'synhax';
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const formData = await request.formData();
		const candidate = formData.get('file');
		if (!(candidate instanceof File)) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		const haxIdRaw = formData.get('hax_id');
		if (typeof haxIdRaw !== 'string' || haxIdRaw.length === 0) {
			return json({ error: 'hax_id is required' }, { status: 400 });
		}

		const file = candidate;
		if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
			return json({ error: 'Unsupported image type' }, { status: 415 });
		}

		if (file.size > MAX_IMAGE_BYTES) {
			return json({ error: 'Image file is too large' }, { status: 413 });
		}

		const db = createDb();
		const [ownedHax] = await db
			.select({ id: hax.id })
			.from(hax)
			.where(and(eq(hax.id, haxIdRaw), eq(hax.user_id, locals.user.id)))
			.limit(1);

		if (!ownedHax) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

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
					image_id: `solo-preview-${haxIdRaw}`,
					content_type: file.type
				})
			}
		);

		if (!presignRes.ok) {
			return json({ error: 'Failed to get presigned URL' }, { status: 502 });
		}

		const { upload_url, transform_url, asset_url } = await presignRes.json();

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

		return json({
			success: true,
			transform_url,
			asset_url
		});
	} catch (error) {
		console.error(
			'Solo preview upload error:',
			error instanceof Error ? error.message : error
		);
		return json({ error: 'Failed to upload preview image' }, { status: 500 });
	}
};
