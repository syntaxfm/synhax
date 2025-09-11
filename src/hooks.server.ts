import * as Sentry from '@sentry/sveltekit';
import type { HandleServerError, Handle } from '@sveltejs/kit';
import { auth } from '$lib/auth';

// Server SDK initialized in instrumentation.server.ts per manual setup docs

const myErrorHandler = ({ error, event }: { error: unknown; event: unknown }) => {
	console.error('An error occurred on the server side:', error, event);
};
export const handleError: HandleServerError = Sentry.handleErrorWithSentry(myErrorHandler);

const sentryHandle = Sentry.sentryHandle();

export const handle: Handle = async ({ event, resolve }) => {
	// First run Sentry's handler (starts trace, sets up scope)
	const response = await sentryHandle({ event, resolve });

	// Then enrich scope with auth user (cannot alter already-sent spans, but user context attaches to future events in same request lifecycle if emitted later)
	try {
		const session = await auth.api.getSession({ headers: event.request.headers });
		if (session) {
			event.locals.session = session.session;
			event.locals.user = { id: session.user.id, role: session.user.role || undefined };
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
