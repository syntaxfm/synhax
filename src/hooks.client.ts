import * as Sentry from '@sentry/sveltekit';
Sentry.init({
	dsn: 'https://a825005a7ee52dd8ea15b555f4eaa374@o4507217476845568.ingest.us.sentry.io/4510003969458176',
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/sveltekit/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
	//  performance
	// Set tracesSampleRate to 1.0 to capture 100%
	// of transactions for tracing.
	// We recommend adjusting this value in production
	// Learn more at
	// https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
	tracesSampleRate: 1.0,
	//  performance
	integrations: [
		//  session-replay
		Sentry.replayIntegration()
		//  session-replay
		//  user-feedback
		// Sentry.feedbackIntegration({
		// 	// Additional SDK configuration goes in here, for example:
		// 	colorScheme: 'system'
		// })
		//  user-feedback
	],
	//  session-replay
	// Capture Replay for 10% of all sessions,
	// plus for 100% of sessions with an error
	// Learn more at
	// https://docs.sentry.io/platforms/javascript/session-replay/configuration/#general-integration-configuration
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1.0,
	//  session-replay
	//  logs
	// Enable logs to be sent to Sentry
	enableLogs: true
	//  logs
});
const myErrorHandler = ({ error, event }) => {
	console.error('An error occurred on the client side:', error, event);
};
export const handleError = Sentry.handleErrorWithSentry(myErrorHandler);
// or alternatively, if you don't have a custom error handler:
// export const handleError = handleErrorWithSentry();
