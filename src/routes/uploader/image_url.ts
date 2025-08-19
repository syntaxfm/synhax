import { R2_PUBLIC_BASE } from '$env/static/private';

// Build a public origin URL (original) from a stored key.
export function r2_origin_url(key: string) {
	const base = R2_PUBLIC_BASE!;
	return `${base}/${encodeURI(key)}`;
}

// Optional: Cloudflare image resizing URL (if CDN is in front of the origin).
// Example: build_cdn_img({ w: 1200, q: 85, format: 'auto' }, r2_origin_url(key))
export function build_cdn_img(
	opts: Partial<{
		w: number;
		h: number;
		q: number;
		fit: 'cover' | 'contain' | 'scale-down' | 'crop';
		format: 'auto' | 'webp' | 'avif';
	}>,
	src: string
) {
	const parts: string[] = [];
	if (opts.w) parts.push(`w=${opts.w}`);
	if (opts.h) parts.push(`h=${opts.h}`);
	if (opts.q) parts.push(`q=${opts.q}`);
	if (opts.fit) parts.push(`fit=${opts.fit}`);
	if (opts.format) parts.push(`format=${opts.format}`);
	const prefix = process.env.PUBLIC_CDN_BASE!;
	return `${prefix}/cdn-cgi/image/${parts.join(',')}/${src}`;
}
