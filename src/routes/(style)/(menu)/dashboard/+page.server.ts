import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is authenticated and has 'syntax' role
	if (!locals.user) {
		throw redirect(303, '/');
	}

	return {};
};
