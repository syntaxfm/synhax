import type { RequestEvent } from '@sveltejs/kit';
import { json, error } from '@sveltejs/kit';
import { createDb } from '$db';
import { user } from '$db/schema';
import { ilike, or, ne, and } from 'drizzle-orm';

/**
 * Server-side user search endpoint
 * Returns only public user fields: id, name, username, avatar, image
 *
 * GET /api/users/search?q=searchterm
 */
export async function GET({ url, locals }: RequestEvent) {
	// Must be authenticated
	if (!locals.user?.id) {
		throw error(401, 'Authentication required');
	}

	const db = createDb();

	const query = url.searchParams.get('q')?.trim() ?? '';

	// Require at least 1 character
	if (query.length < 1) {
		return json([]);
	}

	const searchPattern = `%${query}%`;

	// Search users, excluding the current user
	const users = await db
		.select({
			id: user.id,
			name: user.name,
			username: user.username,
			avatar: user.avatar,
			image: user.image
		})
		.from(user)
		.where(
			and(
				ne(user.id, locals.user.id),
				or(
					ilike(user.name, searchPattern),
					ilike(user.username, searchPattern),
					ilike(user.id, searchPattern)
				)
			)
		)
		.limit(10);

	return json(users);
}
