import type { LayoutServerLoad, LayoutServerLoadEvent } from './$types';

export const ssr = false;

export const load: LayoutServerLoad = async (event: LayoutServerLoadEvent) => {
	return {
		user: event.locals.user
	};
};
