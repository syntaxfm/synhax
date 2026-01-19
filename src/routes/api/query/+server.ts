import type { RequestEvent } from '@sveltejs/kit';
import { mustGetQuery } from '@rocicorp/zero';
import { handleQueryRequest } from '@rocicorp/zero/server';
import { queries } from '$lib/queries';
import { schema } from '$sync/schema';

/**
 * Zero 0.25+ Query API endpoint
 *
 * This endpoint handles synced query requests from the Zero client.
 * It's configured via ZERO_QUERY_URL environment variable.
 */
export async function POST({ request, locals }: RequestEvent) {
	// Get auth context from locals (set by hooks.server.ts)
	console.log('zero query auth', {
		authHeader: request.headers.get('authorization') ? 'present' : 'missing',
		user: locals.user ?? null
	});
	const userID = locals.user?.id ?? 'anon';
	const userRole = locals.user?.role;

	const result = await handleQueryRequest(
		(name, args) => {
			const query = mustGetQuery(queries, name);
			return query.fn({ args, ctx: { userID, userRole } });
		},
		schema,
		request
	);

	return new Response(JSON.stringify(result));
}
