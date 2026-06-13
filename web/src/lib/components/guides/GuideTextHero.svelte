<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';
	import Breadcrumbs from '$lib/components/property/Breadcrumbs.svelte';

	type Props = {
		title: string;
		lead?: string;
		breadcrumbs?: BreadcrumbItem[];
		/** Hide the trailing crumb when the title already headlines the hero. */
		hideCurrentCrumb?: boolean;
		/** Optional row rendered beneath the lead (e.g. meta chips). */
		meta?: Snippet;
	};

	let { title, lead, breadcrumbs, hideCurrentCrumb = false, meta }: Props = $props();
</script>

<section class="guide-text-hero on-dark">
	{#if breadcrumbs && breadcrumbs.length > 0}
		<div class="guide-text-hero__top content-wrap">
			<Breadcrumbs items={breadcrumbs} onDark hideCurrent={hideCurrentCrumb} />
		</div>
	{/if}

	<div class="guide-text-hero__content content-wrap">
		<h1 class="guide-text-hero__title">{title}</h1>
		{#if lead}
			<p class="guide-text-hero__lead">{lead}</p>
		{/if}
		{@render meta?.()}
	</div>
</section>

<style>
	.guide-text-hero {
		background: var(--green);
		border-bottom: 1px solid var(--gold);
		padding-block: clamp(2.5rem, 6vw, 4.5rem);
	}

	.guide-text-hero__top {
		padding-bottom: var(--space-sm);
	}

	.guide-text-hero__content {
		max-width: var(--content-max);
	}

	.guide-text-hero__title {
		color: var(--on-green);
		max-width: 18ch;
	}

	.guide-text-hero__lead {
		margin-top: var(--space-md);
		font-family: var(--sans);
		font-size: 1.125rem;
		color: var(--on-green);
		max-width: 42ch;
		line-height: 1.7;
	}
</style>
