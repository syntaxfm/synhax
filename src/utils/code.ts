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

export function combine_html_and_css(html = '', css = ''): string {
	return `<!DOCTYPE html>
<html>
  <head>
	<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,container-queries"></script>
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
};

export function parseTargetCode(inspo = ''): TargetCode {
	const trimmed = inspo.trim();
	if (!trimmed) {
		return { html: '', css: '' };
	}

	try {
		const parsed = JSON.parse(trimmed) as Partial<TargetCode> | null;
		if (parsed && typeof parsed === 'object') {
			return {
				html: typeof parsed.html === 'string' ? parsed.html : '',
				css: typeof parsed.css === 'string' ? parsed.css : ''
			};
		}
	} catch {
		// fall through to legacy parsing
	}

	const styleMatch = trimmed.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
	if (styleMatch) {
		const css = styleMatch[1].trim();
		const html = trimmed.replace(styleMatch[0], '').trim();
		return { html, css };
	}

	return { html: trimmed, css: '' };
}

export function serializeTargetCode(html = '', css = ''): string {
	return JSON.stringify({ html, css });
}
