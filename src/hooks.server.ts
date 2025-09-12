import * as Sentry from '@sentry/sveltekit';
import type { HandleServerError, Handle } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';

// Server SDK initialized in instrumentation.server.ts per manual setup docs

// Sentry.init({
// 	dsn: 'https://a825005a7ee52dd8ea15b555f4eaa374@o4507217476845568.ingest.us.sentry.io/4510003969458176scott-tolinski-projects / synhax-l1',
// 	// Adds request headers and IP for users, for more info visit:
// 	// https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
// 	sendDefaultPii: true,
// 	// Set tracesSampleRate to 1.0 to capture 100%
// 	// of transactions for tracing.
// 	// We recommend adjusting this value in production
// 	// Learn more at
// 	// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
// 	tracesSampleRate: 1.0,
// 	// Enable logs to be sent to Sentry
// 	enableLogs: true
// });

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

const authHandle: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const sessionHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);
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
	return response;
};

export const handle: Handle = sequence(sentryHandle, authHandle, sessionHandle);
