import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

export const createDb = (platform?: App.Platform) => {
	const connectionString = platform?.env?.HYPERDRIVE?.connectionString ?? ZERO_UPSTREAM_DB;
	const client = postgres(connectionString);
	return drizzle(client);
};

// For backwards compatibility, export default instance
export const db = createDb();
