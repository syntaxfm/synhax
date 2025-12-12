import { PUBLIC_SERVER } from '$env/static/public';
import { Z } from 'zero-svelte';
import { schema, type Schema } from '$sync/schema';
import { get_jwt } from '$lib/user/utils';

function decodeJWT(token: string) {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = parts[1];
		const paddedPayload = payload + '==='.slice((payload.length + 3) % 4);
		const decoded = atob(paddedPayload);
		return JSON.parse(decoded);
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
}

async function get_z_options() {
	const jwt = await get_jwt();
	let userID = 'anon';

	if (jwt) {
		const decoded = decodeJWT(jwt);
		userID = decoded?.sub || 'anon';
	}

	return {
		userID,
		server: PUBLIC_SERVER,
		schema,
		jwt: jwt || undefined
	} as const;
}

export const z = new Z<Schema>(await get_z_options());
