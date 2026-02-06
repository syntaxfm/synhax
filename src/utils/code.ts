// Base styles to ensure iframe body fills container and is capturable
const BASE_STYLES = /*css*/ `
	*, *::before, *::after { box-sizing: border-box; }
	html, body {
		margin: 0;
		padding: 0;
		width: 100%;
		height: 100%;
		overflow: hidden;
    font-family: sans-serif;
    -webkit-font-smoothing: antialiased;
	}

  input, button, textarea, select {
    font: inherit;
  }

	body {
		background: #1a1a1a;
	}
  /* This is the most cursed CSS ever. This fixes a big where global styles are applied to the snapdom container. */
  foreignObject div:has(> html) {
    all: unset;
  }
  /* Set the body BG color to transparent so its not counted in the diff */
  /* foreignObject body {
    background: transparent !important;
  } */
`;

// Tailwind CSS CDN for client-side JIT compilation
// Note: SRI not used as CDN content changes frequently with JIT compilation
const TAILWIND_CDN = 'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4';

function createContentSecurityPolicy(hasTailwind: boolean): {
	policy: string;
	tailwindNonce: string | null;
} {
	const tailwindNonce = hasTailwind
		? crypto.randomUUID().replaceAll('-', '')
		: null;
	const scriptSrc = tailwindNonce
		? `script-src 'nonce-${tailwindNonce}'`
		: "script-src 'none'";

	const policy = [
		"default-src 'none'",
		scriptSrc,
		"style-src 'unsafe-inline' https: http:",
		'img-src data: blob: https: http:',
		'media-src data: blob: https: http:',
		'font-src data: blob: https: http:',
		'connect-src https: http:',
		"base-uri 'none'",
		"form-action 'none'",
		"object-src 'none'"
	].join('; ');

	return { policy, tailwindNonce };
}

export function usesTailwind(css = ''): boolean {
	return /^\s*@import\s+["']tailwindcss["']/m.test(css);
}

export function combine_html_and_css(html = '', css = ''): string {
	const hasTailwind = usesTailwind(css);
	const { policy, tailwindNonce } = createContentSecurityPolicy(hasTailwind);

	const csp = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
	const tailwindScript = hasTailwind
		? `<script nonce="${tailwindNonce}" async src="${TAILWIND_CDN}"></script>`
		: '';

	return `<!DOCTYPE html>
<html>
  <head>
  ${csp}
  ${tailwindScript}
  <style>
  ${BASE_STYLES}
  ${css}
  </style>

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
		return {
			html: '',
			css: '',
			starter_html: '',
			starter_css: '',
			url: trimmed
		};
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
