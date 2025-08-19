import { json, error } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { eq } from 'drizzle-orm';
import { R2_BUCKET } from '$env/static/private';
import { db } from '$db';
import { images } from '$db/schema';
import { r2_client } from '../rs_client';

export const POST = async ({ request, locals }) => {
	// assume you have session in locals; replace with your auth
	const user_id = locals.user?.id as string | undefined;
	if (!user_id) throw error(401, 'unauthorized');

	const { file_name, content_type } = await request.json();
	if (!file_name || !content_type) throw error(400, 'bad request');

	const key = `uploads/${crypto.randomUUID()}-${file_name}`;
	const bucket = R2_BUCKET!;

	const command = new PutObjectCommand({
		Bucket: bucket,
		Key: key,
		ContentType: content_type,
		ACL: 'private' // keep private; serve via signed GET or CDN proxy
	});

	const signed_url = await getSignedUrl(r2_client, command, { expiresIn: 600 });

	const [row] = await db.insert(images).values({ user_id, key }).returning();

	return json({ key, id: row.id, signed_url });
};

// optional: DELETE to remove an image you own
export const DELETE = async ({ url, locals }) => {
	const user_id = locals.user?.id as string | undefined;
	if (!user_id) throw error(401, 'unauthorized');

	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'missing id');

	// soft delete not shown; do a lookup to ensure ownership
	const existing = await db.query.images.findFirst({ where: (t, { eq }) => eq(t.id, id) });
	if (!existing || existing.user_id !== user_id) throw error(404, 'not found');

	// you can also delete from R2 via S3 DeleteObjectCommand
	// keeping storage cleanup as a separate job is common

	await db.delete(images).where(eq(images.id, id));
	return new Response(null, { status: 204 });
};
