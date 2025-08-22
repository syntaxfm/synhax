export async function get_jwt() {
	try {
		const res = await fetch('/api/auth/token');
		// Handle 401 specifically to avoid console errors for unauthenticated users
		if (res.status === 401) return null;
		if (!res.ok) return null;
		const { token } = await res.json();
		return token;
	} catch (error) {
		return null;
	}
}

export function to_snake_case(str: string): string {
	return str.replace(/\s+/g, '_').toLowerCase();
}

export function s(str: string | null): string {
	return str || '';
}
