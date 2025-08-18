import { createAuthClient } from 'better-auth/svelte';
export const authClient = createAuthClient();

// await authClient.signOut({
// 	fetchOptions: {
// 		onSuccess: () => {
// 			router.push('/login'); // redirect to login page
// 		}
// 	}
// });
