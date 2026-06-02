<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { isPreviewing, useLiveMode } from '@sanity/svelte-loader';
	import { enableVisualEditing } from '@sanity/visual-editing';
	import { env as publicEnv } from '$env/dynamic/public';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import '$lib/styles/global.css';

	let { children, data } = $props();

	const studioUrl = publicEnv.PUBLIC_SANITY_STUDIO_URL ?? 'http://localhost:3333/development';

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

<SiteNav />

<main class="site-main">
	{@render children()}
</main>

<Footer countries={data.nav.countries} locations={data.nav.locations} />

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
