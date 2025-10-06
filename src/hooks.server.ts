import * as Sentry from '@sentry/sveltekit';
import type { HandleServerError, Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
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
import { admin, jwt } from 'better-auth/plugins';
import { betterAuth } from 'better-auth';
import type { BetterAuthOptions } from 'better-auth';

// Server SDK initialized in instrumentation.server.ts per manual setup docs

Sentry.init({
	dsn: 'https://a825005a7ee52dd8ea15b555f4eaa374@o4507217476845568.ingest.us.sentry.io/4510003969458176scott-tolinski-projects / synhax-l1',
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for tracing.
	// We recommend adjusting this value in production
	// Learn more at
	// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
	tracesSampleRate: 1.0,
	// Enable logs to be sent to Sentry
	enableLogs: true
});

const myErrorHandler = ({
	error,
	event
}: {
	error: unknown;
	event: unknown;
}) => {
	console.error('An error occurred on the server side:', error, event);
};
export const handleError: HandleServerError =
	Sentry.handleErrorWithSentry(myErrorHandler);

const sentryHandle = Sentry.sentryHandle();

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
		socialProviders: {
			github: {
				clientId: GITHUB_CLIENT_ID,
				clientSecret: GITHUB_CLIENT_SECRET
			}
		},
		plugins: [admin(), jwt()]
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
				Sentry.setUser({
					id: session.user.id,
					username: session.user.name || undefined,
					email: session.user.email || undefined
				});
			} else {
				Sentry.setUser(null);
			}
		} catch (e) {
			Sentry.captureException(e);
		}
		const response = await resolve(event);
		return response;
	};

	// Build handler chain
	const chain = sequence(sentryHandle, authHandle, sessionHandle);

	try {
		return await chain({ event, resolve });
	} finally {
		// Explicit connection cleanup (optional but safer)
		await sql.end();
	}
};
