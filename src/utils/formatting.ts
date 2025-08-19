export function remove_screaming(text: string): string {
	return text
		.toLowerCase()
		.replace('_', ' ') // Remove non-alphanumeric characters except spaces
		.trim(); // Trim leading and trailing whitespace
}
