import type { RequestEvent } from '@sveltejs/kit';
import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { mustGetMutator } from '@rocicorp/zero';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg';
import { mutators } from '$lib/mutators';
import { schema } from '$sync/schema';

export async function POST({ request, platform, locals }: RequestEvent) {
	// Use Hyperdrive connection string if available (Cloudflare), otherwise fall back to env
	const connectionString =
		platform?.env?.HYPERDRIVE?.connectionString ?? ZERO_UPSTREAM_DB;

	const dbProvider = zeroNodePg(schema, connectionString);

	// Get auth context from locals (set by hooks.server.ts)
	const userId = locals.user?.id ?? 'anon';
	const userRole = locals.user?.role;

	const result = await handleMutateRequest(
		dbProvider,
		(transact) =>
			transact((tx, name, args) => {
				const mutator = mustGetMutator(mutators, name);
				return mutator.fn({
					args,
					tx,
					ctx: { userId, userRole }
				});
			}),
		request
	);

	return new Response(JSON.stringify(result));
}
