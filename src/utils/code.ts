// Base styles to ensure iframe body fills container and is capturable
const BASE_STYLES = `
	*, *::before, *::after { box-sizing: border-box; }
	html, body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
	}
	body {
		background: #1a1a1a;
	}
`;

// Tailwind CSS CDN for client-side JIT compilation
// Note: SRI not used as CDN content changes frequently with JIT compilation
const TAILWIND_CDN = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';

export function combine_html_and_css(html = '', css = ''): string {
	const usesTailwind = /^\s*@import\s+["']tailwindcss["']/m.test(css);

	const csp = usesTailwind
		? `<meta http-equiv="Content-Security-Policy" content="script-src ${TAILWIND_CDN}">`
		: '';
	const tailwindScript = usesTailwind ? `<script async src="${TAILWIND_CDN}"></script>` : '';


	return `<!DOCTYPE html>
<html>
  <head>
	<style>
		${BASE_STYLES}
		${css}
	</style>
	${csp}
	${tailwindScript}
  </head>
  <body>
    ${html}
  </body>
</html>
`;
}

export type TargetCode = {
	html: string;
	css: string;
	starter_html: string;
	starter_css: string;
	/** URL for IMAGE/VIDEO type targets */
	url: string;
};

export function parseTargetCode(inspo = ''): TargetCode {
	const trimmed = inspo.trim();
	if (!trimmed) {
		return { html: '', css: '', starter_html: '', starter_css: '', url: '' };
	}

	try {
		const parsed = JSON.parse(trimmed) as Partial<TargetCode> | null;
		if (parsed && typeof parsed === 'object') {
			return {
				html: typeof parsed.html === 'string' ? parsed.html : '',
				css: typeof parsed.css === 'string' ? parsed.css : '',
				starter_html:
					typeof parsed.starter_html === 'string' ? parsed.starter_html : '',
				starter_css:
					typeof parsed.starter_css === 'string' ? parsed.starter_css : '',
				url: typeof parsed.url === 'string' ? parsed.url : ''
			};
		}
	} catch {
		// fall through to legacy parsing
	}

	// Legacy: check for HTML with embedded <style> tags
	const styleMatch = trimmed.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
	if (styleMatch) {
		const css = styleMatch[1].trim();
		const html = trimmed.replace(styleMatch[0], '').trim();
		return { html, css, starter_html: '', starter_css: '', url: '' };
	}

	// Legacy: for IMAGE/VIDEO, inspo might be a plain URL string
	if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
		return { html: '', css: '', starter_html: '', starter_css: '', url: trimmed };
	}

	return { html: trimmed, css: '', starter_html: '', starter_css: '', url: '' };
}

/** Serialize CODE target data */
export function serializeTargetCode(
	html = '',
	css = '',
	starter_html = '',
	starter_css = ''
): string {
	return JSON.stringify({ html, css, starter_html, starter_css });
}

/** Serialize IMAGE/VIDEO target data */
export function serializeTargetMedia(
	url = '',
	starter_html = '',
	starter_css = ''
): string {
	return JSON.stringify({ url, starter_html, starter_css });
}
