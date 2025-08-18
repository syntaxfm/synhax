<script lang="ts">
	import { authClient } from '$lib/auth-client';
	const session = authClient.useSession();
</script>

{#if $session.data}
	<div>
		<p>
			{$session?.data?.user.name}
		</p>
	</div>
{/if}
