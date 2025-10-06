import type { PageServerLoad } from './(style)/$types';

export const load: PageServerLoad = async ({ locals }) => {
	return {
		user: locals.user
	};
};
