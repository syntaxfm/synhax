<script lang="ts">
	import { onMount } from 'svelte';
	import '../reset.css';
	import '@drop-in/graffiti';
	import './style.css';
	import favicon from '$lib/assets/favicon.png';

	let { children } = $props();
	let showCompatibilityBanner = $state(false);

	type NavigatorWithUAData = Navigator & {
		userAgentData?: {
			brands?: Array<{ brand: string; version: string }>;
			mobile?: boolean;
		};
	};

	function isDesktopChromiumLike(): boolean {
		const navigatorWithUAData = window.navigator as NavigatorWithUAData;
		const { userAgentData } = navigatorWithUAData;

		if (userAgentData?.brands?.length) {
			const brands = userAgentData.brands.map(({ brand }) =>
				brand.toLowerCase()
			);
			const isChromiumBrand = brands.some(
				(brand) =>
					brand.includes('chrom') ||
					brand.includes('edge') ||
					brand.includes('opera') ||
					brand.includes('brave')
			);

			return !userAgentData.mobile && isChromiumBrand;
		}

		const ua = window.navigator.userAgent;
		const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
		const isChromiumLike = /chrome|chromium|crios|edg\/|opr\//i.test(ua);

		return !isMobile && isChromiumLike;
	}

	onMount(() => {
		const hasDirectoryPicker =
			'showDirectoryPicker' in window &&
			typeof window.showDirectoryPicker === 'function';

		showCompatibilityBanner = !hasDirectoryPicker || !isDesktopChromiumLike();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if showCompatibilityBanner}
	<aside class="compatibility-banner" role="status" aria-live="polite">
		<strong>Battle requirement:</strong> A desktop chromium-based browser is required
		to join battles. Your current browser may not support required file-system features.
	</aside>
{/if}

{@render children?.()}

<style>
	.compatibility-banner {
		position: sticky;
		top: 0;
		z-index: 10;
		margin: 0.65rem;
		padding: 0.75rem 1rem;
		border: 2px solid #9f1f00;
		border-radius: 0.5rem;
		background: linear-gradient(180deg, #fff2ef 0%, #ffd8cf 100%);
		color: #4a1100;
		font-size: 0.95rem;
		font-weight: 600;
		line-height: 1.35;
		box-shadow: 0 6px 16px rgb(58 9 0 / 18%);
	}

	.compatibility-banner strong {
		display: inline-block;
		margin-right: 0.25rem;
	}
</style>
