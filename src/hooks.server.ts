import * as Sentry from '@sentry/sveltekit';
import type { HandleServerError, Handle } from '@sveltejs/kit';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building, dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import postgres from 'postgres';
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
import { env } from '$env/dynamic/private';
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

const REDACTED = '[redacted]';

function truncateText(value: string, max = 1200): string {
	if (value.length <= max) {
		return value;
	}

	return `${value.slice(0, max)}...`;
}

function sanitizeBetterAuthText(value: string): string {
	let sanitized = value;

	sanitized = sanitized.replace(/params:\s[\s\S]*$/i, `params: ${REDACTED}`);
	sanitized = sanitized.replace(
		/(codeVerifier|accessToken|refreshToken|idToken|password|token)"?\s*[:=]\s*"[^"]*"/gi,
		`$1": "${REDACTED}"`
	);

	return truncateText(sanitized);
}

function sanitizeBetterAuthArg(arg: unknown): unknown {
	if (arg instanceof Error) {
		const details = extractBetterAuthError(arg);
		return {
			name: details.name,
			message: details.message,
			code: details.code,
			table: details.table,
			column: details.column,
			constraint: details.constraint,
			cause: details.cause
		};
	}

	if (typeof arg === 'string') {
		return sanitizeBetterAuthText(arg);
	}

	if (!arg || typeof arg !== 'object') {
		return arg;
	}

	if (Array.isArray(arg)) {
		return arg.map(sanitizeBetterAuthArg);
	}

	const output: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(arg as Record<string, unknown>)) {
		const lowerKey = key.toLowerCase();
		if (
			lowerKey.includes('token') ||
			lowerKey.includes('password') ||
			lowerKey.includes('cookie') ||
			lowerKey.includes('secret') ||
			lowerKey.includes('codeverifier')
		) {
			output[key] = REDACTED;
			continue;
		}

		if (typeof value === 'string') {
			output[key] = sanitizeBetterAuthText(value);
			continue;
		}

		if (
			typeof value === 'number' ||
			typeof value === 'boolean' ||
			value === null
		) {
			output[key] = value;
			continue;
		}

		output[key] = Array.isArray(value) ? '[array]' : `[${typeof value}]`;
	}

	return output;
}

function extractBetterAuthError(error: Error) {
	const record = error as unknown as Record<string, unknown>;
	const cause = record.cause;

	const details: {
		name: string;
		message: string;
		stack?: string;
		cause?: string;
		code?: string;
		detail?: string;
		table?: string;
		column?: string;
		constraint?: string;
	} = {
		name: error.name,
		message: sanitizeBetterAuthText(error.message)
	};

	if (typeof error.stack === 'string') {
		details.stack = sanitizeBetterAuthText(error.stack);
	}

	if (cause instanceof Error) {
		details.cause = sanitizeBetterAuthText(cause.message);
	} else if (typeof cause === 'string') {
		details.cause = sanitizeBetterAuthText(cause);
	}

	for (const key of [
		'code',
		'detail',
		'table',
		'column',
		'constraint'
	] as const) {
		const value = record[key];
		if (typeof value === 'string' && value.length > 0) {
			details[key] = sanitizeBetterAuthText(value);
		}
	}

	return details;
}

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
	const sanitizedArgs = args.map(sanitizeBetterAuthArg);
	const firstError = args.find((arg): arg is Error => arg instanceof Error);
	const sanitizedMessage = sanitizeBetterAuthText(message);

	Sentry.withScope((scope: any) => {
		scope.setTag('source', 'better-auth');
		scope.setTag('log_level', level);
		scope.setFingerprint(['better-auth', sanitizedMessage]);
		scope.setExtra('argTypes', argTypes);
		scope.setExtra('args', sanitizedArgs);

		if (firstError) {
			const details = extractBetterAuthError(firstError);
			scope.setContext('better_auth_error', details);
			if (details.code) {
				scope.setTag('error_code', details.code);
			}

			const capturedError = new Error(
				details.message || `[Better Auth] ${sanitizedMessage}`
			);
			capturedError.name = details.name || 'BetterAuthError';
			if (details.stack) {
				capturedError.stack = details.stack;
			}

			Sentry.captureException(capturedError, {
				mechanism: {
					type: 'better-auth.logger',
					handled: true
				}
			});
			return;
		}

		Sentry.captureMessage(`[Better Auth] ${sanitizedMessage}`, 'error');
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

function createAuthInstance(connectionString: string) {
	const sql = postgres(connectionString, {
		prepare: false, // Better with external poolers (e.g. Supabase pooler)
		max: 5,
		fetch_types: false
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
				const logArgs = dev ? args : args.map(sanitizeBetterAuthArg);
				const safeMessage =
					typeof message === 'string'
						? sanitizeBetterAuthText(message)
						: String(message);

				if (level === 'error') {
					console.error(`[Better Auth] ${safeMessage}`, ...logArgs);
					return;
				}

				if (level === 'warn') {
					console.warn(`[Better Auth] ${safeMessage}`, ...logArgs);
					return;
				}

				if (dev) {
					console.log(`[Better Auth] ${safeMessage}`, ...logArgs);
				}
			}
		},
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

	return { auth, sql };
}

export const handle: Handle = async ({ event, resolve }) => {
	if (!env.DB_URL) {
		throw new Error('Missing DB_URL environment variable.');
	}

	const { auth, sql } = createAuthInstance(env.DB_URL);

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
		await sql.end();
	}
};
