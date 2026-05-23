<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import SiteNav from '$lib/components/SiteNav.svelte';
	import '$lib/styles/global.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Golf Homes International</title>
	<meta
		name="description"
		content="Curated residential properties on and near premier golf courses in southern Europe and beyond."
	/>
</svelte:head>

<SiteNav />

<main class="site-main">
	{@render children()}
</main>
