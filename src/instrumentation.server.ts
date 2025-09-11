import * as Sentry from '@sentry/sveltekit';

// Guard against environments/build targets where Sentry.init may not be exported
try {
	if (typeof (Sentry as any)?.init === 'function') {
		Sentry.init({
			// NOTE: For server instrumentation; DSN kept the same hardcoded value per your request.
			dsn: 'https://4c3dd30e37c046e7bf60b7c0d97bc85f@sentry.io/4508593516322816',
			// Send headers/IP etc if you want enriched user + request context.
			sendDefaultPii: true,
			tracesSampleRate: 1.0, // Adjust in production
			profilesSampleRate: 1.0, // Optional: high for now; reduce later
			enableLogs: true,
			environment: (globalThis as any)?.process?.env?.NODE_ENV || 'development',
			release:
				(globalThis as any)?.SENTRY_RELEASE?.id || (globalThis as any)?.process?.env?.SENTRY_RELEASE
		});
	} else {
		console.warn('[sentry] init not available in this runtime variant; skipping');
	}
} catch (err) {
	console.warn('[sentry] init failed, continuing without instrumentation', err);
}
