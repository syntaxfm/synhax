import { PUBLIC_SERVER } from '$env/static/public';
import { Z } from 'zero-svelte';
import { schema, type Schema } from './schema';
import { get_jwt } from '$lib/user/utils';
// Schema is imported from wherever your Schema type lives.
// via export type Schema = typeof schema;

function decodeJWT(token: string) {
	try {
		// JWT has 3 parts separated by dots: header.payload.signature
		const parts = token.split('.');
		if (parts.length !== 3) return null;

		// Decode the payload (second part)
		const payload = parts[1];
		// Add padding if needed for base64 decoding
		const paddedPayload = payload + '==='.slice((payload.length + 3) % 4);
		const decoded = atob(paddedPayload);
		return JSON.parse(decoded);
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
}

export async function get_z_options() {
	const jwt = await get_jwt();
	let userId = 'anon';

	if (jwt) {
		const decoded = decodeJWT(jwt);
		userId = decoded?.sub || 'anon';
	}

	return {
		userID: userId,
		server: PUBLIC_SERVER,
		schema,
		jwt: jwt || null
	} as const;
}

export const z = new Z<Schema>(await get_z_options());
