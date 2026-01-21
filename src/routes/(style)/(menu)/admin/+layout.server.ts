import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}
	if (locals.user.role !== 'syntax') {
		throw redirect(302, '/');
	}
	return {
		user: locals.user
	};
};

