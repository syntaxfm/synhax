import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	// NOTE: For server instrumentation; DSN kept the same hardcoded value per your request.
	dsn: 'https://4c3dd30e37c046e7bf60b7c0d97bc85f@sentry.io/4508593516322816',
	// Send headers/IP etc if you want enriched user + request context.
	sendDefaultPii: true,
	tracesSampleRate: 1.0, // Adjust in production
	profilesSampleRate: 1.0, // Optional: high for now; reduce later
	enableLogs: true,
	environment: process.env.NODE_ENV || 'development',
	release: process.env.SENTRY_RELEASE
});
