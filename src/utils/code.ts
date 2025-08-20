export function combine_html_and_css(html = '', css = ''): string {
	return `<!DOCTYPE html>
<html>
	<style>
		${css}
	</style>
  <body>
    ${html}
  </body>
</html>
`;
}
