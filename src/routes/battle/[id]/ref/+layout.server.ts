import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Check if user is authenticated and has 'syntax' role
	// TODO
	// Check if current user is referee for this battle
	// if (!locals.user || locals.user.role !== 'syntax') {
	// 	throw redirect(303, '/dashboard');
	// }

	return {};
};
