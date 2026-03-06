import { ZERO_UPSTREAM_DB } from '$env/static/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

type RuntimeEnv = {
	DB_URL?: string;
	ZERO_UPSTREAM_DB?: string;
	DATABASE_URL?: string;
};

let cachedDb: ReturnType<typeof drizzle> | null = null;

function resolveConnectionString(platform?: App.Platform) {
	const runtimeEnv = platform?.env as RuntimeEnv | undefined;

	return (
		runtimeEnv?.DB_URL ??
		runtimeEnv?.ZERO_UPSTREAM_DB ??
		runtimeEnv?.DATABASE_URL ??
		process.env.DB_URL ??
		process.env.ZERO_UPSTREAM_DB ??
		process.env.DATABASE_URL ??
		ZERO_UPSTREAM_DB
	);
}

export const createDb = (platform?: App.Platform) => {
	if (cachedDb) {
		return cachedDb;
	}

	const connectionString = resolveConnectionString(platform);

	if (!connectionString) {
		throw new Error(
			'No database connection string found. Set DB_URL (recommended) or ZERO_UPSTREAM_DB.'
		);
	}

	const client = postgres(connectionString, {
		prepare: false,
		max: 5,
		fetch_types: false
	});

	cachedDb = drizzle(client);
	return cachedDb;
};

// Backwards compatibility: keep `db` export lazily initialized.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(_target, prop, receiver) {
		const instance = createDb();
		const value = Reflect.get(instance as object, prop, receiver);
		return typeof value === 'function' ? value.bind(instance) : value;
	}
});
