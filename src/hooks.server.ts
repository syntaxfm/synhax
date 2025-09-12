import * as Sentry from '@sentry/sveltekit';
import type { HandleServerError, Handle } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';

// Server SDK initialized in instrumentation.server.ts per manual setup docs

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
