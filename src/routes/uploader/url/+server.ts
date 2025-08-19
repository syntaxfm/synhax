import { json, error } from '@sveltejs/kit';
import { build_cdn_img, r2_origin_url } from '../image_url';
import { db } from '$db';

export const GET = async ({ url, locals }) => {
	const user_id = locals.user?.id as string | undefined;
	if (!user_id) throw error(401, 'unauthorized');

	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'missing id');

	const variant = url.searchParams.get('v'); // 'thumb'|'md'|'lg' or custom sizes
	const img = await db.query.images.findFirst({ where: (t, { eq }) => eq(t.id, id) });
	if (!img || img.user_id !== user_id) throw error(404, 'not found');

	const src = r2_origin_url(img.key);

	// return both original and an example CDN-resized URL (if configured)
	const cdn = process.env.PUBLIC_CDN_BASE
		? build_cdn_img(
				variant === 'thumb'
					? { w: 200, q: 75, fit: 'cover', format: 'auto' }
					: variant === 'md'
						? { w: 800, q: 80, fit: 'cover', format: 'auto' }
						: variant === 'lg'
							? { w: 1600, q: 85, fit: 'cover', format: 'auto' }
							: { w: 1200, q: 82, fit: 'cover', format: 'auto' },
				src
			)
		: null;

	return json({ original: src, cdn });
};
