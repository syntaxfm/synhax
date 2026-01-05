import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	// Disabled: experimental.async breaks SvelteKit client-side navigation
	// compilerOptions: {
	// 	experimental: {
	// 		async: true
	// 	}
	// },

	kit: {
		adapter: adapter(),
		alias: {
			$lib: 'src/lib',
			$routes: 'src/routes',
			$sync: 'src/sync',
			$db: 'src/db',
			$utils: 'src/utils',
			$const: 'src/constants'
		},
		experimental: {
			remoteFunctions: true,
			instrumentation: { server: true },
			tracing: { server: true }
		}
	}
};

export default config;
