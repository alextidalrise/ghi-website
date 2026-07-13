<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';

	type Props = {
		title: string;
		lead?: string;
		breadcrumbs?: BreadcrumbItem[];
	};

	let { title, lead, breadcrumbs }: Props = $props();
</script>

<section class="insights-hero on-dark">
	{#if breadcrumbs && breadcrumbs.length > 0}
		<div class="insights-hero__top content-wrap">
			<Breadcrumbs items={breadcrumbs} onDark hideCurrent />
		</div>
	{/if}

	<div class="insights-hero__content content-wrap">
		<h1 class="insights-hero__title">{title}</h1>
		{#if lead}
			<p class="insights-hero__lead">{lead}</p>
		{/if}
	</div>
</section>

<style>
	.insights-hero {
		background: var(--green);
		border-bottom: 1px solid var(--gold);
		padding-block: clamp(2.5rem, 6vw, 4.5rem);
	}

	.insights-hero__top {
		padding-bottom: var(--space-sm);
	}

	.insights-hero__content {
		max-width: var(--content-max);
	}

	.insights-hero__title {
		color: var(--on-green);
		max-width: 18ch;
	}

	.insights-hero__lead {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: 1.125rem;
		color: var(--on-green);
		max-width: 46ch;
		line-height: 1.7;
	}
</style>
