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

function toAbsoluteUrl(origin: string, maybeRelative: string): string {
	if (!maybeRelative) return '';

	if (
		maybeRelative.startsWith('http://') ||
		maybeRelative.startsWith('https://')
	) {
		return maybeRelative;
	}

	if (maybeRelative.startsWith('/')) {
		return `${origin}${maybeRelative}`;
	}

	return `${origin}/${maybeRelative}`;
}

function formatScore(score: number | null): string {
	if (score === null) return 'Unscored';
	return `${score.toFixed(2)}%`;
}

function buildMarkup(args: {
	origin: string;
	sharePath: string;
	targetName: string;
	battleName: string;
	playerLabel: string;
	scoreLabel: string;
	targetImageUrl: string | null;
}) {
	const shareLinkText = `${args.origin.replace(/^https?:\/\//, '')}${args.sharePath}`;

	return `
<div style="display:flex; width:1200px; height:630px; background:#070b13; color:#f9fbff; position:relative; font-family:system-ui; overflow:hidden;">
	<div style="display:flex; position:absolute; inset:0; background:linear-gradient(132deg, #141f36 0%, #090d16 52%, #05070d 100%);"></div>
	<div style="display:flex; position:absolute; right:-120px; top:-150px; width:520px; height:520px; border-radius:999px; background:rgba(76, 134, 255, 0.2);"></div>
	<div style="display:flex; position:relative; width:100%; padding:56px; justify-content:space-between; align-items:stretch; gap:36px;">
		<div style="display:flex; flex-direction:column; justify-content:space-between; width:56%;">
			<div style="display:flex; flex-direction:column; gap:14px;">
				<div style="display:flex; align-items:center; gap:10px; font-size:28px; font-weight:800; letter-spacing:0.02em;">
					<span style="display:flex; width:18px; height:18px; border-radius:999px; background:#ffe54a;"></span>
					<span>Synhax Solo</span>
				</div>
				<div style="display:flex; font-size:34px; font-weight:700; line-height:1.15; color:#dce4ff;">${escapeHtml(args.playerLabel)}</div>
				<div style="display:flex; font-size:26px; color:#b7c2e6;">completed ${escapeHtml(args.battleName)}</div>
				<div style="display:flex; flex-direction:column; gap:6px; margin-top:8px;">
					<div style="display:flex; font-size:22px; color:#9daddb; text-transform:uppercase; letter-spacing:0.08em;">Diff Score</div>
					<div style="display:flex; font-size:88px; line-height:1; font-weight:900; color:#ffe54a;">${escapeHtml(args.scoreLabel)}</div>
				</div>
			</div>
			<div style="display:flex; flex-direction:column; gap:8px;">
				<div style="display:flex; font-size:18px; color:#c5d0f2;">Target: ${escapeHtml(args.targetName)}</div>
				<div style="display:flex; font-size:16px; color:#8c99c2;">${escapeHtml(shareLinkText)}</div>
			</div>
		</div>
		<div style="display:flex; flex-direction:column; width:44%; align-items:flex-end; justify-content:center; gap:14px;">
			<div style="display:flex; width:470px; height:470px; border-radius:24px; overflow:hidden; border:1px solid rgba(255, 255, 255, 0.2); background:#111724; align-items:center; justify-content:center;">
				${
					args.targetImageUrl
						? `<img src="${escapeHtml(args.targetImageUrl)}" width="470" height="470" style="width:470px; height:470px; object-fit:cover;" />`
						: `<div style="display:flex; width:100%; height:100%; align-items:center; justify-content:center; color:#9aa7d2; font-size:24px;">Target preview unavailable</div>`
				}
			</div>
			<div style="display:flex; font-size:16px; color:#a9b5da; text-transform:uppercase; letter-spacing:0.08em;">Target preview</div>
		</div>
	</div>
</div>`;
}

function buildFallbackSvg(args: {
	title: string;
	scoreLabel: string;
	targetName: string;
	playerLabel: string;
	targetImageUrl: string | null;
}): string {
	const escapedTitle = escapeHtml(args.title);
	const escapedScore = escapeHtml(args.scoreLabel);
	const escapedTargetName = escapeHtml(args.targetName);
	const escapedPlayer = escapeHtml(args.playerLabel);
	const escapedImage = args.targetImageUrl
		? escapeHtml(args.targetImageUrl)
		: '';

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapedTitle}">
	<defs>
		<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0%" stop-color="#15203b" />
			<stop offset="100%" stop-color="#05070d" />
		</linearGradient>
	</defs>
	<rect width="1200" height="630" fill="url(#bg)" />
	<rect x="56" y="56" width="620" height="518" rx="20" fill="#0b1222" fill-opacity="0.75" stroke="#304064" />
	<text x="96" y="126" font-family="system-ui, sans-serif" font-size="30" fill="#f8fbff" font-weight="700">Synhax Solo</text>
	<text x="96" y="178" font-family="system-ui, sans-serif" font-size="42" fill="#f8fbff" font-weight="700">${escapedPlayer}</text>
	<text x="96" y="226" font-family="system-ui, sans-serif" font-size="28" fill="#b7c2e6">Target: ${escapedTargetName}</text>
	<text x="96" y="286" font-family="system-ui, sans-serif" font-size="22" fill="#94a5d8" letter-spacing="2">DIFF SCORE</text>
	<text x="96" y="384" font-family="system-ui, sans-serif" font-size="92" fill="#ffe54a" font-weight="900">${escapedScore}</text>
	<rect x="730" y="80" width="400" height="400" rx="18" fill="#111723" stroke="#415785" />
	${
		escapedImage
			? `<image href="${escapedImage}" x="730" y="80" width="400" height="400" preserveAspectRatio="xMidYMid slice" />`
			: `<text x="930" y="292" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" fill="#8fa0c8">Target preview unavailable</text>`
	}
	<text x="730" y="522" font-family="system-ui, sans-serif" font-size="24" fill="#c8d3f2">${escapedTitle}</text>
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
	const sharePath = `/share/solo/${data.battleId}`;
	const playerLabel =
		data.userUsername && data.userUsername.length > 0
			? `@${data.userUsername}`
			: data.userName;

	const absoluteTargetImage = toAbsoluteUrl(origin, data.targetImage);
	const proxiedTargetImage = absoluteTargetImage
		? `https://wsrv.nl/?url=${encodeURIComponent(absoluteTargetImage)}&w=940&h=940&fit=cover`
		: null;

	const scoreLabel = formatScore(data.diffScore);
	const title = `${playerLabel} scored ${scoreLabel} on ${data.targetName}`;

	const markup = buildMarkup({
		origin,
		sharePath,
		targetName: data.targetName,
		battleName: data.battleName,
		playerLabel,
		scoreLabel,
		targetImageUrl: proxiedTargetImage
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
		targetImageUrl: proxiedTargetImage
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
