import type { HandleServerError, Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building, dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import postgres from 'postgres';
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	ZERO_UPSTREAM_DB
} from '$env/static/private';
import * as schema from './db/schema';
import { drizzle } from 'drizzle-orm/postgres-js';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, jwt, bearer } from 'better-auth/plugins';
import { betterAuth } from 'better-auth';

// Sentry disabled on Cloudflare Workers due to edge runtime compatibility issues
// See beads issue battle_mode-pfd for @sentry/cloudflare-workers setup

const myErrorHandler = ({
	error,
	event
}: {
	error: unknown;
	event: unknown;
}) => {
	console.error('An error occurred on the server side:', error, event);
};
export const handleError: HandleServerError = myErrorHandler;

export const handle: Handle = async ({ event, resolve }) => {
	const env = event.platform?.env as
		| { DATABASE_URL?: string; HYPERDRIVE?: { connectionString: string } }
		| undefined;
	const connectionString =
		env?.HYPERDRIVE?.connectionString || ZERO_UPSTREAM_DB;

	// Fail loudly if no connection string
	if (!connectionString) {
		throw new Error(
			'No database connection string found. Check HYPERDRIVE binding or DATABASE_URL env var.'
		);
	}
	// Create per-request connection (correct for Cloudflare Workers)
	// Hyperdrive handles global connection pooling
	const sql = postgres(connectionString, {
		prepare: true, // Required for Hyperdrive query caching
		max: 5, // Respect Workers' 6-connection limit
		fetch_types: false // Skip if not using array types (reduces roundtrips)
	});

	const db = drizzle(sql, { schema });
	const auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema
		}),
		// Email/password auth only in development mode
		...(dev && {
			emailAndPassword: {
				enabled: true
			}
		}),
		socialProviders: {
			github: {
				clientId: GITHUB_CLIENT_ID,
				clientSecret: GITHUB_CLIENT_SECRET,
				mapProfileToUser: (profile) => ({
					username: profile.login
				})
			}
		},
		user: {
			additionalFields: {
				username: {
					type: 'string',
					required: false
				}
			}
		},
		plugins: [admin(), jwt(), bearer()]
	});

	const authHandle: Handle = async ({ event, resolve }) => {
		return svelteKitHandler({ event, resolve, auth, building });
	};

	const sessionHandle: Handle = async ({ event, resolve }) => {
		try {
			const session = await auth.api.getSession({
				headers: event.request.headers
			});
			if (session) {
				event.locals.session = session.session;
				event.locals.user = {
					id: session.user.id,
					role: session.user.role || undefined
				};
			} else {
				const authHeader = event.request.headers.get('authorization');
				const token = authHeader?.startsWith('Bearer ')
					? authHeader.slice('Bearer '.length)
					: undefined;
				if (token) {
					const result = await auth.api.verifyJWT({
						body: { token }
					});
					const payload = result?.payload as
						| { sub?: string; role?: string; id?: string }
						| null
						| undefined;
					if (payload?.sub || payload?.id) {
						event.locals.user = {
							id: payload.sub ?? payload.id ?? 'anon',
							role: payload.role || undefined
						};
					}
				}
			}
		} catch (e) {
			console.error('Session error:', e);
		}
		const response = await resolve(event);
		return response;
	};

	// Build handler chain
	const chain = sequence(authHandle, sessionHandle);

	try {
		return await chain({ event, resolve });
	} finally {
		// Explicit connection cleanup (optional but safer)
		await sql.end();
	}
};
