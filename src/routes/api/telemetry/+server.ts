import type { RequestEvent } from '@sveltejs/kit';

const SENTRY_DSN =
	'https://a825005a7ee52dd8ea15b555f4eaa374@o4507217476845568.ingest.us.sentry.io/4510003969458176';
const MAX_ENVELOPE_BYTES = 200_000;

function getSentryEndpoint(dsn: string): string {
	const parsed = new URL(dsn);
	const host = parsed.host;
	const projectId = parsed.pathname.replace('/', '');
	return `https://${host}/api/${projectId}/envelope/`;
}

export async function POST({ request }: RequestEvent) {
	const contentLengthHeader = request.headers.get('content-length');
	if (contentLengthHeader) {
		const contentLength = Number(contentLengthHeader);
		if (Number.isFinite(contentLength) && contentLength > MAX_ENVELOPE_BYTES) {
			return new Response('Payload too large', { status: 413 });
		}
	}

	const envelope = await request.text();
	if (new TextEncoder().encode(envelope).byteLength > MAX_ENVELOPE_BYTES) {
		return new Response('Payload too large', { status: 413 });
	}

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
