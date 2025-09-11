import * as Sentry from '@sentry/sveltekit';

Sentry.init({
	dsn: 'https://4c3dd30e37c046e7bf60b7c0d97bc85f@sentry.io/4508593516322816',
	sendDefaultPii: true,
	tracesSampleRate: 1.0,
	profilesSampleRate: 1.0,
	enableLogs: true,
	integrations: [Sentry.replayIntegration()],
	replaysSessionSampleRate: 0.05,
	replaysOnErrorSampleRate: 1.0,
	environment: import.meta.env.MODE || 'development'
});

import type { HandleClientError } from '@sveltejs/kit';

const myErrorHandler: HandleClientError = ({ error, event }) => {
	console.error('An error occurred on the client side:', error, event);
};

export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
