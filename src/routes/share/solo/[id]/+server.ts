import { getPublicSoloShareData } from '$lib/server/solo-share';
import type { RequestHandler } from './$types';

const CRAWLER_USER_AGENT_PATTERNS = [
	/twitterbot/i,
	/facebookexternalhit/i,
	/facebot/i,
	/linkedinbot/i,
	/slackbot/i,
	/discordbot/i,
	/whatsapp/i,
	/telegrambot/i,
	/skypeuripreview/i,
	/googlebot/i,
	/bingbot/i,
	/pinterest/i,
	/xbot/i
];

function isCrawlerUserAgent(userAgent: string): boolean {
	if (!userAgent) return false;
	return CRAWLER_USER_AGENT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function escapeHtml(value: string): string {
	return value
		.split('&')
		.join('&amp;')
		.split('<')
		.join('&lt;')
		.split('>')
		.join('&gt;')
		.split('"')
		.join('&quot;')
		.split("'")
		.join('&#39;');
}

function formatScore(score: number | null): string {
	if (score === null) {
		return 'Unscored';
	}

	return `${score.toFixed(2)}%`;
}

function formatDuration(ms: number | null): string | null {
	if (ms === null) {
		return null;
	}

	const secondsTotal = Math.floor(ms / 1000);
	const minutes = Math.floor(secondsTotal / 60)
		.toString()
		.padStart(2, '0');
	const seconds = (secondsTotal % 60).toString().padStart(2, '0');
	return `${minutes}:${seconds}`;
}

export const GET: RequestHandler = async (event) => {
	const data = await getPublicSoloShareData(event.params.id);

	if (!data) {
		return new Response('Share page not found', {
			status: 404,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'public, max-age=60, s-maxage=60'
			}
		});
	}

	const origin = event.url.origin;
	const recapPath = `/recap/${data.battleId}`;
	const recapUrl = `${origin}${recapPath}`;
	const shareUrl = `${origin}/share/solo/${data.battleId}`;
	const scoreLabel = formatScore(data.diffScore);
	const durationLabel = formatDuration(data.completionMs);
	const scoreVersion =
		data.haxUpdatedAt ?? data.diffScoreUpdatedAt ?? data.completedAt ?? 0;
	const ogImageUrl = `${origin}/og/solo/${data.battleId}.png?v=${scoreVersion}`;

	const playerLabel =
		data.userUsername && data.userUsername.length > 0
			? `@${data.userUsername}`
			: data.userName;

	const title = `${playerLabel} scored ${scoreLabel} on ${data.targetName} in Synhax Solo`;
	const description = durationLabel
		? `Final score: ${scoreLabel} in ${durationLabel}. View the public recap and challenge this target on Synhax.`
		: `Final score: ${scoreLabel}. View the public recap and challenge this target on Synhax.`;

	const userAgent = event.request.headers.get('user-agent') ?? '';
	const isCrawler = isCrawlerUserAgent(userAgent);
	const previewMode = event.url.searchParams.get('preview') === '1';

	if (!isCrawler && !previewMode) {
		return new Response(null, {
			status: 302,
			headers: {
				Location: recapPath,
				'Cache-Control': 'no-store'
			}
		});
	}

	const html = `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${escapeHtml(title)}</title>

		<link rel="canonical" href="${escapeHtml(recapUrl)}" />
		<meta name="description" content="${escapeHtml(description)}" />

		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="Synhax" />
		<meta property="og:url" content="${escapeHtml(recapUrl)}" />
		<meta property="og:title" content="${escapeHtml(title)}" />
		<meta property="og:description" content="${escapeHtml(description)}" />
		<meta property="og:image" content="${escapeHtml(ogImageUrl)}" />
		<meta property="og:image:alt" content="${escapeHtml(`${playerLabel} scored ${scoreLabel} on ${data.targetName}`)}" />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />

		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content="${escapeHtml(title)}" />
		<meta name="twitter:description" content="${escapeHtml(description)}" />
		<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}" />
	</head>
	<body>
		<p>Social metadata endpoint for this solo recap.</p>
		<p>Recap: <a href="${escapeHtml(recapUrl)}">${escapeHtml(recapUrl)}</a></p>
		<p>Share URL: <a href="${escapeHtml(shareUrl)}">${escapeHtml(shareUrl)}</a></p>
	</body>
</html>`;

	return new Response(html, {
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'public, max-age=300, s-maxage=3600'
		}
	});
};
