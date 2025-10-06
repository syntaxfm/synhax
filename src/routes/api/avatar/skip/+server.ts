import { json } from '@sveltejs/kit';
import { db } from '$db';
import { user } from '$db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ locals }) {
	try {
		// Check authentication
		if (!locals.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = locals.user.id;

		// Update user's avatar to default unknown.png
		await db.update(user).set({ avatar: '/unknown.png' }).where(eq(user.id, userId));

		return json({ avatar: '/unknown.png' }, { status: 200 });
	} catch (error) {
		console.error('Avatar skip error:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to skip avatar' },
			{ status: 500 }
		);
	}
}
