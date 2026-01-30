import { PUBLIC_SERVER } from '$env/static/public';
import { Z } from 'zero-svelte';
import { schema } from '$sync/schema';
import { get_jwt } from '$lib/user/utils';
import { queries } from '$lib/queries';
import { mutators } from '$lib/mutators';

function decodeJWT(token: string): { sub?: string; role?: string } | null {
	try {
		const parts = token.split('.');
		if (parts.length !== 3) return null;
		const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
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
	let userRole: string | undefined = undefined;

	if (jwt) {
		const decoded = decodeJWT(jwt);
		userID = decoded?.sub || 'anon';
		userRole = decoded?.role;
	} else {
		console.log('JWT not found', jwt);
	}

	const context = {
		userID,
		userRole
	};

	return {
		userID,
		server: PUBLIC_SERVER,
		schema,
		mutators,
		context,
		auth: jwt || undefined
	};
}

// Top-level await to initialize Z with proper auth context
// This works correctly when experimental.async is DISABLED
export const z = new Z(await get_z_options());

// Function to reinitialize Z with fresh JWT (call after login)
export async function reinitializeZ() {
	const options = await get_z_options();
	z.build(options);
}

// Re-export queries and mutators for convenient access
export { queries, mutators };
