import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }: RequestEvent) => {
	if (!locals.user?.id) {
		throw redirect(303, '/');
	}

	return {};
};
