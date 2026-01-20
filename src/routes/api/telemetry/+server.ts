import type { RequestEvent } from '@sveltejs/kit';

const SENTRY_DSN =
	'https://a825005a7ee52dd8ea15b555f4eaa374@o4507217476845568.ingest.us.sentry.io/4510003969458176';

function getSentryEndpoint(dsn: string): string {
	const parsed = new URL(dsn);
	const host = parsed.host;
	const projectId = parsed.pathname.replace('/', '');
	return `https://${host}/api/${projectId}/envelope/`;
}

export async function POST({ request }: RequestEvent) {
	const envelope = await request.text();
	const endpoint = getSentryEndpoint(SENTRY_DSN);

	const response = await fetch(endpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-sentry-envelope'
		},
		body: envelope
	});

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText
	});
}
