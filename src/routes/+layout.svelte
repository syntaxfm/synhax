<script lang="ts">
	import { PUBLIC_SERVER } from '$env/static/public';
	import { schema, type Schema } from '$sync/schema.js';

	import { Z } from 'zero-svelte';

	const { children, data } = $props();

	new Z<Schema>({
		userID: data?.user?.id ? data.user.id : 'anon',
		server: PUBLIC_SERVER,
		schema
	});
</script>

{@render children()}
