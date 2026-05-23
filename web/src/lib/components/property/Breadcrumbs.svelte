<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';

	type Props = {
		items: BreadcrumbItem[];
	};

	let { items }: Props = $props();
</script>

<nav class="breadcrumbs content-wrap" aria-label="Breadcrumb">
	<ol class="breadcrumbs__list">
		{#each items as item, index (item.label + (item.href ?? index))}
			<li class="breadcrumbs__item">
				{#if item.href && index < items.length - 1}
					<a href={item.href}>{item.label}</a>
				{:else}
					<span aria-current="page">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	.breadcrumbs {
		padding-block: var(--space-md);
	}

	.breadcrumbs__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0;
		list-style: none;
		font-size: var(--text-small);
		color: var(--muted);
	}

	.breadcrumbs__item:not(:last-child)::after {
		content: '/';
		margin-inline: 0.5rem;
		color: var(--border);
	}

	.breadcrumbs__item a {
		color: var(--green);
		text-decoration: none;
	}

	.breadcrumbs__item a:hover,
	.breadcrumbs__item a:focus-visible {
		text-decoration: underline;
	}

	.breadcrumbs__item span {
		color: var(--charcoal);
	}
</style>
