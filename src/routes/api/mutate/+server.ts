import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { mustGetMutator } from '@rocicorp/zero';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg';
import { mutators } from '$lib/mutators';
import { schema, type ZeroContext } from '$sync/schema';

function getDbProvider(): any {
	if (!env.DB_URL) {
		throw new Error('Missing DB_URL environment variable.');
	}

	return zeroNodePg(schema, env.DB_URL);
}

export async function POST({ request, locals }: RequestEvent) {
	const dbProvider = getDbProvider();

	// Get auth context from locals (set by hooks.server.ts)
	const ctx: ZeroContext = {
		userID: locals.user?.id ?? 'anon',
		userRole: locals.user?.role
	};

	const result = await handleMutateRequest(
		dbProvider,
		(transact: any) =>
			transact((tx: any, name: string, args: any) => {
				const mutator = mustGetMutator(mutators, name) as any;
				return mutator.fn({ args, tx, ctx });
			}),
		request
	);

	return new Response(JSON.stringify(result), {
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-store'
		}
	});
}
