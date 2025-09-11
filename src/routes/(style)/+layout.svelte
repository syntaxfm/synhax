<script lang="ts">
	import '../reset.css';
	import './style.css';
	import * as Sentry from '@sentry/sveltekit';
	import { browser } from '$app/environment';

	if (browser) {
		Sentry.init({
			dsn: import.meta.env.PUBLIC_SENTRY_DSN,
			tracesSampleRate: 0.1,
			profilesSampleRate: 0.1,
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
			environment: import.meta.env.MODE || 'development',
			release: import.meta.env.VITE_SENTRY_RELEASE
		});
	}
	import favicon from '$lib/assets/favicon.svg';
	import { z } from '$sync/client';
	import { Query } from 'zero-svelte';
	import Jukebox from '$lib/media/Jukebox.svelte';

	let { children } = $props();

	const battles = new Query(z.current.query.battles);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<!-- <Jukebox /> -->
