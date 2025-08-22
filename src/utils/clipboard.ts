/**
 * Copies a string to the clipboard using the modern Clipboard API
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves when copy is successful, rejects on error
 */
export async function copyToClipboard(text: string): Promise<void> {
	try {
		await navigator.clipboard.writeText(text);
	} catch (error) {
		console.error('Failed to copy to clipboard:', error);
		throw new Error('Failed to copy to clipboard');
	}
}

/**
 * Synchronous version that attempts to copy but doesn't wait for completion
 * Useful when you don't want to handle async/await
 * @param text - The text to copy to clipboard
 */
export function copyToClipboardSync(text: string): void {
	copyToClipboard(text).catch((error) => {
		console.error('Copy failed:', error);
	});
}
