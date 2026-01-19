export function remove_screaming(text: string): string {
	return text
		.toLowerCase()
		.replace(/_/g, ' ')
		.replace(/(^|\s)\S/g, (match) => match.toUpperCase())
		.trim();
}
