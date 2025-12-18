import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { zeroDrizzle } from '@rocicorp/zero/server/adapters/drizzle';
import { ZERO_UPSTREAM_DB } from '$env/static/private';
import * as drizzleSchema from '$db/schema';
import { schema } from '$sync/schema';

/**
 * Creates a database provider for Zero server-side operations.
 * This is used by the /api/query and /api/mutate endpoints.
 *
 * @param connectionString - Optional connection string, defaults to ZERO_UPSTREAM_DB
 */
export function createDbProvider(connectionString?: string) {
	const connStr = connectionString ?? ZERO_UPSTREAM_DB;

	if (!connStr) {
		throw new Error(
			'No database connection string found. Check ZERO_UPSTREAM_DB env var.'
		);
	}

	const sql = postgres(connStr, {
		prepare: true,
		max: 5
	});

	const drizzleClient = drizzle(sql, { schema: drizzleSchema });

	return zeroDrizzle(schema, drizzleClient);
}

/**
 * Default database provider instance for server-side Zero operations.
 */
export const dbProvider = createDbProvider();
