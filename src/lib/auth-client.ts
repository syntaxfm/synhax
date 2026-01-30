import { jwtClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/svelte';
export const authClient = createAuthClient({
	plugins: [jwtClient()]
});
