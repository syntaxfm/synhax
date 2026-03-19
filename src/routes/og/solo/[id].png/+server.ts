import { getPublicSoloShareData } from '$lib/server/solo-share';
import type { RequestHandler } from './$types';

type ImageResponseLike = {
	arrayBuffer(): Promise<ArrayBuffer>;
};

type ImageResponseCtor = new (
	markup: string,
	options: { width: number; height: number }
) => ImageResponseLike;

let imageResponseCtorPromise: Promise<ImageResponseCtor | null> | null = null;
let wasmReadyPromise: Promise<void> | null = null;

async function loadImageResponseCtor(): Promise<ImageResponseCtor | null> {
	if (!imageResponseCtorPromise) {
		imageResponseCtorPromise = import('workers-og')
			.then((module) => module.ImageResponse as ImageResponseCtor)
			.catch((error) => {
				console.error('Failed to load workers-og, using SVG fallback:', error);
				return null;
			});
	}

	return imageResponseCtorPromise;
}

async function ensureWasmReady(ctor: ImageResponseCtor): Promise<void> {
	if (!wasmReadyPromise) {
		wasmReadyPromise = new ctor('<div style="display:flex"></div>', {
			width: 1,
			height: 1
		})
			.arrayBuffer()
			.then(() => undefined)
			.catch(() => undefined);
	}

	await wasmReadyPromise;
}

function escapeHtml(value: string): string {
	let sanitized = '';
	for (const char of value) {
		const codePoint = char.codePointAt(0);
		if (codePoint === undefined) continue;

		const isValidXmlCharacter =
			codePoint === 0x9 ||
			codePoint === 0xa ||
			codePoint === 0xd ||
			(codePoint >= 0x20 && codePoint <= 0xd7ff) ||
			(codePoint >= 0xe000 && codePoint <= 0xfffd) ||
			(codePoint >= 0x10000 && codePoint <= 0x10ffff);

		if (isValidXmlCharacter) {
			sanitized += char;
		}
	}

	return sanitized
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
	if (score === null) return 'Unscored';
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

function buildMarkup(args: {
	targetName: string;
	playerLabel: string;
	scoreLabel: string;
	durationLabel: string | null;
	patternImageUrl: string;
	logoImageUrl: string;
	resultImageUrl: string | null;
}) {
	return `
<div style="display:flex; width:1200px; height:630px; background:#05070f; color:#f9fbff; position:relative; font-family:Arial, Helvetica, sans-serif; overflow:hidden;">
	<div style="display:flex; position:absolute; inset:0; background-image:url('${escapeHtml(args.patternImageUrl)}'); background-repeat:repeat; background-size:348px 348px; opacity:0.2;"></div>
	<div style="display:flex; position:absolute; inset:0; background:linear-gradient(130deg, rgba(7, 10, 22, 0.92) 0%, rgba(7, 10, 22, 0.96) 62%, rgba(7, 10, 22, 0.9) 100%);"></div>
	<div style="display:flex; position:relative; width:100%; padding:56px; justify-content:space-between; align-items:stretch; gap:36px;">
		<div style="display:flex; flex-direction:column; justify-content:space-between; width:56%;">
			<div style="display:flex; flex-direction:column; gap:18px;">
				<div style="display:flex; flex-direction:column; gap:20px; margin-bottom:10px;">
					<img src="${escapeHtml(args.logoImageUrl)}" width="540" height="100" style="width:100%; height:100px; object-fit:contain; object-position:left center;" />
					<div style="display:flex; align-items:center; gap:10px; font-size:30px; font-weight:800; letter-spacing:0.02em; color:#d0dbff;">
						<span>${escapeHtml(args.targetName)}</span>
					</div>
				</div>
				<div style="display:flex; font-size:34px; font-weight:700; line-height:1.15; color:#dce4ff;">${escapeHtml(args.playerLabel)}</div>
				<div style="display:flex; flex-direction:column; gap:6px; margin-top:4px;">
					<div style="display:flex; font-size:22px; color:#9daddb; text-transform:uppercase; letter-spacing:0.08em;">Diff Score</div>
					<div style="display:flex; font-size:88px; line-height:1; font-weight:900; color:#ffe54a;">${escapeHtml(args.scoreLabel)}</div>
				</div>
			</div>
			<div style="display:flex; align-items:center; gap:18px; flex-wrap:wrap;">
				${
					args.durationLabel
						? `<div style="display:flex; font-size:18px; color:#9fb0da;">Time: ${escapeHtml(args.durationLabel)}</div>`
						: ''
				}
			</div>
		</div>
		<div style="display:flex; flex-direction:column; width:44%; align-items:flex-end; justify-content:center; gap:14px;">
			<div style="display:flex; width:460px; height:307px; overflow:hidden; background:#111724; box-shadow:0 28px 56px rgba(0, 0, 0, 0.58), 0 10px 20px rgba(0, 0, 0, 0.44); align-items:center; justify-content:center;">
				${
					args.resultImageUrl
						? `<img src="${escapeHtml(args.resultImageUrl)}" width="460" height="307" style="width:460px; height:307px; object-fit:contain;" />`
						: `<div style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; color:#9aa7d2; font-size:24px;">Final result unavailable</div>`
				}
			</div>
			<div style="display:flex; font-size:16px; color:#a9b5da; text-transform:uppercase; letter-spacing:0.08em;">Final result</div>
		</div>
	</div>
</div>`;
}

function buildFallbackSvg(args: {
	title: string;
	scoreLabel: string;
	targetName: string;
	playerLabel: string;
	durationLabel: string | null;
	patternImageUrl: string;
	logoImageUrl: string;
	resultImageUrl: string | null;
}): string {
	const escapedTitle = escapeHtml(args.title);
	const escapedScore = escapeHtml(args.scoreLabel);
	const escapedTargetName = escapeHtml(args.targetName);
	const escapedPlayer = escapeHtml(args.playerLabel);
	const escapedPatternImage = escapeHtml(args.patternImageUrl);
	const escapedLogoImage = escapeHtml(args.logoImageUrl);
	const escapedImage = args.resultImageUrl
		? escapeHtml(args.resultImageUrl)
		: '';
	const escapedDuration = args.durationLabel
		? escapeHtml(args.durationLabel)
		: null;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapedTitle}">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#090d1f" />
			<stop offset="100%" stop-color="#05070d" />
		</linearGradient>
		<pattern id="bgPattern" patternUnits="userSpaceOnUse" width="348" height="348">
			<image href="${escapedPatternImage}" x="0" y="0" width="348" height="348" preserveAspectRatio="none" />
		</pattern>
		<filter id="resultShadow" x="640" y="86" width="560" height="390" filterUnits="userSpaceOnUse">
			<feDropShadow dx="0" dy="14" stdDeviation="13" flood-color="#000000" flood-opacity="0.58" />
		</filter>
	</defs>
	<rect width="1200" height="630" fill="url(#bg)" />
	<rect width="1200" height="630" fill="url(#bgPattern)" opacity="0.2" />
	<rect x="56" y="56" width="620" height="518" rx="20" fill="#0b1222" fill-opacity="0.84" stroke="#304064" />
	<image href="${escapedLogoImage}" x="96" y="80" width="540" height="100" preserveAspectRatio="xMinYMid meet" />
	<text x="96" y="220" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#d0dbff" font-weight="700">${escapedTargetName}</text>
	<text x="96" y="278" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="#f8fbff" font-weight="700">${escapedPlayer}</text>
	<text x="96" y="360" font-family="Arial, Helvetica, sans-serif" font-size="22" fill="#94a5d8" letter-spacing="2">DIFF SCORE</text>
	<text x="96" y="468" font-family="Arial, Helvetica, sans-serif" font-size="92" fill="#ffe54a" font-weight="900">${escapedScore}</text>
	${
		escapedDuration
			? `<text x="96" y="540" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#9fb0da">Time: ${escapedDuration}</text>`
			: ''
	}
	<rect x="700" y="120" width="440" height="293" fill="#111723" filter="url(#resultShadow)" />
	${
		escapedImage
			? `<image href="${escapedImage}" x="700" y="120" width="440" height="293" preserveAspectRatio="xMidYMid meet" />`
			: `<text x="920" y="282" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#8fa0c8">Final result unavailable</text>`
	}
	<text x="700" y="450" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#c8d3f2">Final result</text>
</svg>`;
}

async function renderPng(
	markup: string,
	ctor: ImageResponseCtor
): Promise<ArrayBuffer> {
	const imageResponse = new ctor(markup, {
		width: 1200,
		height: 630
	});

	return imageResponse.arrayBuffer();
}

async function resolveResultImageUrl(
	candidateUrl: string
): Promise<string | null> {
	if (!candidateUrl) {
		return null;
	}

	try {
		const headResponse = await fetch(candidateUrl, { method: 'HEAD' });
		if (!headResponse.ok) {
			return null;
		}

		const contentType = headResponse.headers.get('content-type') ?? '';
		if (contentType && !contentType.startsWith('image/')) {
			return null;
		}

		return candidateUrl;
	} catch {
		return null;
	}
}

function getEdgeCache(): Cache | null {
	const cacheStorage = globalThis.caches as
		| (CacheStorage & {
				default?: Cache;
		  })
		| undefined;

	return cacheStorage?.default ?? null;
}

export const GET: RequestHandler = async (event) => {
	const cache = getEdgeCache();
	if (cache) {
		const cached = await cache.match(event.request);
		if (cached) {
			return cached;
		}
	}

	const data = await getPublicSoloShareData(event, event.params.id);

	if (!data) {
		return new Response('Not found', {
			status: 404,
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'public, max-age=60, s-maxage=60'
			}
		});
	}

	const origin = event.url.origin;
	const playerLabel =
		data.userUsername && data.userUsername.length > 0
			? `@${data.userUsername}`
			: data.userName;

	const patternImageUrl = `${origin}/bg-pattern.png`;
	const logoImageUrl = `${origin}/synhax-logo-yellow.svg`;
	const deterministicResultAssetUrl = data.haxId
		? `https://assets.break-code.com/assets/raw/synhax/solo-preview-${data.haxId}/original.png`
		: '';
	const resultImageUrl = await resolveResultImageUrl(
		deterministicResultAssetUrl
	);

	const scoreLabel = formatScore(data.diffScore);
	const durationLabel = formatDuration(data.completionMs);
	const title = `${playerLabel} scored ${scoreLabel} on ${data.targetName}`;

	const markup = buildMarkup({
		targetName: data.targetName,
		playerLabel,
		scoreLabel,
		durationLabel,
		patternImageUrl,
		logoImageUrl,
		resultImageUrl
	});

	const imageCtor = await loadImageResponseCtor();

	if (imageCtor) {
		await ensureWasmReady(imageCtor);

		try {
			const pngBuffer = await renderPng(markup, imageCtor);
			const pngResponse = new Response(pngBuffer, {
				headers: {
					'Content-Type': 'image/png',
					'Cache-Control': 'public, max-age=3600, s-maxage=86400'
				}
			});

			if (cache) {
				await cache.put(event.request, pngResponse.clone());
			}

			return pngResponse;
		} catch (error) {
			console.error(
				'workers-og render failed, returning SVG fallback instead:',
				error
			);
		}
	}

	const fallbackSvg = buildFallbackSvg({
		title,
		scoreLabel,
		targetName: data.targetName,
		playerLabel,
		durationLabel,
		patternImageUrl,
		logoImageUrl,
		resultImageUrl
	});

	const fallbackResponse = new Response(fallbackSvg, {
		headers: {
			'Content-Type': 'image/svg+xml; charset=utf-8',
			'Cache-Control': 'public, max-age=600, s-maxage=3600',
			'X-OG-Fallback': 'svg'
		}
	});

	if (cache) {
		await cache.put(event.request, fallbackResponse.clone());
	}

	return fallbackResponse;
};
