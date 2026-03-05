import * as Sentry from '@sentry/sveltekit';
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

const SENTRY_DSN =
	'https://a825005a7ee52dd8ea15b555f4eaa374@o4507217476845568.ingest.us.sentry.io/4510003969458176';

const sentryInitHandle = Sentry.initCloudflareSentryHandle({
	dsn: SENTRY_DSN,
	sendDefaultPii: true,
	tracesSampleRate: 1.0,
	enableLogs: true
});

const sentryHandle = Sentry.sentryHandle();

function captureBetterAuthLog(
	level: 'debug' | 'info' | 'warn' | 'error',
	message: string,
	args: unknown[]
) {
	if (level !== 'error') {
		return;
	}

	const argTypes = args.map((arg) => {
		if (arg instanceof Error) {
			return `Error:${arg.name}`;
		}
		if (Array.isArray(arg)) {
			return 'array';
		}
		if (arg === null) {
			return 'null';
		}
		return typeof arg;
	});

	Sentry.withScope((scope) => {
		scope.setTag('source', 'better-auth');
		scope.setTag('log_level', level);
		scope.setFingerprint(['better-auth', message]);
		scope.setExtra('argTypes', argTypes);
		Sentry.captureMessage(`[Better Auth] ${message}`, 'error');
	});
}

const myErrorHandler: HandleServerError = ({ error, event }) => {
	console.error('Server error', {
		path: event.url.pathname,
		method: event.request.method,
		error: error instanceof Error ? error.message : String(error)
	});
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);

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
		logger: {
			level: dev ? 'debug' : 'warn',
			log(level, message, ...args) {
				captureBetterAuthLog(level, message, args);

				if (level === 'error') {
					console.error(`[Better Auth] ${message}`, ...args);
					return;
				}

				if (level === 'warn') {
					console.warn(`[Better Auth] ${message}`, ...args);
					return;
				}

				if (dev) {
					console.log(`[Better Auth] ${message}`, ...args);
				}
			}
		},
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
		plugins: [
			admin(),
			jwt({
				jwt: {
					expirationTime: '7d'
				}
			}),
			bearer()
		]
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
					email: session.user.email || undefined,
					username: session.user.name || undefined
				});
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
						Sentry.setUser({
							id: payload.sub ?? payload.id ?? 'anon'
						});
					} else {
						Sentry.setUser(null);
					}
				} else {
					Sentry.setUser(null);
				}
			}
		} catch (e) {
			Sentry.captureException(e, {
				tags: { source: 'session-handle' }
			});
			console.error(
				'Session error:',
				e instanceof Error ? e.message : String(e)
			);
		}
		const response = await resolve(event);
		return response;
	};

	// Build handler chain
	const chain = sequence(
		sentryInitHandle,
		sentryHandle,
		authHandle,
		sessionHandle
	);

	try {
		return await chain({ event, resolve });
	} finally {
		// Explicit connection cleanup (optional but safer)
		await sql.end();
	}
};
