<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { isPreviewing, useLiveMode } from '@sanity/svelte-loader';
	import { enableVisualEditing } from '@sanity/visual-editing';
	import { env as publicEnv } from '$env/dynamic/public';
	import { onMount, tick, untrack } from 'svelte';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { configureAnalytics, createConsentContext, resetAnalyticsSession, trackPageView } from '$lib/analytics';
	import '$lib/styles/global.css';

	let { children, data } = $props();

	// Both come from the server: the gate was resolved in analyticsHandle, and the consent
	// cookie was read there too, so the first client render already agrees with the markup
	// and the consent UI can render without a flash. Read untracked and once — the root
	// layout never remounts, both calls are idempotent, and consent changes after this
	// point are owned by the consent module, not by layout data.
	const initialAnalytics = untrack(() => data.analytics);
	configureAnalytics(initialAnalytics?.mode ?? 'off');

	// Request-scoped: the store must not be module-level, or on the server one visitor's
	// decision would render for everyone who followed. Consent UI reads it via getConsent().
	createConsentContext(initialAnalytics?.consent ?? null);

	// Clear per-page dedupe state before the new DOM commits. It has to happen here rather
	// than alongside the page view: a list container's `update()` runs as the new page
	// renders, which is before afterNavigate, so resetting later would discard the
	// impression just recorded and allow a duplicate on the next scroll.
	beforeNavigate(() => resetAnalyticsSession());

	// The single source of page views — the GTM Google Tag has send_page_view disabled.
	// afterNavigate fires once on initial load and once per completed navigation
	// (including back/forward), so this is exactly one page view per navigation.
	afterNavigate(async () => {
		// Titles are set by each page's <svelte:head>; let that flush before reading it.
		await tick();
		trackPageView({
			url: page.url,
			routeId: page.route.id,
			title: document.title,
			pageAnalytics: page.data.pageAnalytics
		});
	});

	const studioUrl = publicEnv.PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333/development';

	// The pre-launch holding page is a full-screen takeover: it opts out of the
	// SiteNav + Footer shell (and its padding) so nothing else shows while unlaunched.
	const bare = $derived(page.route.id === '/soon');

	onMount(() => {
		if (!$isPreviewing) {
			return;
		}

		enableVisualEditing();
		useLiveMode({ studioUrl });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Golf Homes International</title>
	<meta
		name="description"
		content="Curated residential properties on and near premier golf courses in southern Europe and beyond."
	/>
</svelte:head>

{#if $isPreviewing}
	<div class="preview-banner" role="status">
		<span>Draft preview — unpublished changes may be visible.</span>
		<a href="/preview/disable?redirect={encodeURIComponent(page.url.pathname)}">
			Exit preview
		</a>
	</div>
{/if}

{#if bare}
	{@render children()}
{:else}
	<SiteNav nav={data.headerNav} />

	<main class="site-main">
		{@render children()}
	</main>

	<Footer footer={data.footer} />
{/if}

<style>
	.preview-banner {
		position: sticky;
		top: 0;
		z-index: 100;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		padding: 0.5rem 1rem;
		background: var(--green);
		color: var(--on-green);
		font-size: var(--text-ui);
	}

	.preview-banner a {
		color: var(--on-green);
		text-decoration: underline;
	}
</style>
