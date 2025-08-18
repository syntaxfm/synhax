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
