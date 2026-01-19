import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = async (event: PageServerLoadEvent) => {
	// Check if user is authenticated and has 'syntax' role
	if (event.locals.user) {
		throw redirect(303, '/dashboard');
	}

	return {};
};
