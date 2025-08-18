<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';

	async function logout() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: () => {
					goto('/'); // redirect to start page
				}
			}
		});
	}
</script>

<button onclick={logout}>Logout</button>
