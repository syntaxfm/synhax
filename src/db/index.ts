import { env } from '$env/dynamic/private';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

function requireConnectionString() {
	const connectionString = env.DB_URL;

	if (!connectionString) {
		throw new Error('Missing DB_URL environment variable.');
	}

	return connectionString;
}

export const createDb = () => {
	const client = postgres(requireConnectionString(), {
		prepare: false,
		max: 1,
		fetch_types: false
	});

	return drizzle(client);
};

// Backwards compatibility: keep `db` export lazily initialized.
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
	get(_target, prop, receiver) {
		const instance = createDb();
		const value = Reflect.get(instance as object, prop, receiver);
		return typeof value === 'function' ? value.bind(instance) : value;
	}
});
