import type { RequestEvent } from '@sveltejs/kit';
import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { mustGetMutator } from '@rocicorp/zero';
import { handleMutateRequest } from '@rocicorp/zero/server';
import { zeroNodePg } from '@rocicorp/zero/server/adapters/pg';
import { mutators } from '$lib/mutators';
import { schema, type ZeroContext } from '$sync/schema';

type RuntimeEnv = {
	DB_URL?: string;
	ZERO_UPSTREAM_DB?: string;
	DATABASE_URL?: string;
};

let runtimeDbProvider: any = null;

function resolveConnectionString(platformEnv?: RuntimeEnv) {
	return (
		platformEnv?.DB_URL ??
		platformEnv?.ZERO_UPSTREAM_DB ??
		platformEnv?.DATABASE_URL ??
		process.env.DB_URL ??
		process.env.ZERO_UPSTREAM_DB ??
		process.env.DATABASE_URL ??
		ZERO_UPSTREAM_DB
	);
}

function getDbProvider(platform?: App.Platform): any {
	if (runtimeDbProvider) {
		return runtimeDbProvider;
	}

	const runtimeEnv = platform?.env as RuntimeEnv | undefined;
	const connectionString = resolveConnectionString(runtimeEnv);

	if (!connectionString) {
		throw new Error(
			'No database connection string found. Set DB_URL (recommended) or ZERO_UPSTREAM_DB.'
		);
	}

	runtimeDbProvider = zeroNodePg(schema, connectionString);
	return runtimeDbProvider;
}

export async function POST({ request, platform, locals }: RequestEvent) {
	const dbProvider = getDbProvider(platform);

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
