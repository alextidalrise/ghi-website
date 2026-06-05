<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';

	type Props = {
		items: BreadcrumbItem[];
		/** Light treatment for breadcrumbs laid over a dark hero image. */
		onDark?: boolean;
	};

	let { items, onDark = false }: Props = $props();
</script>

<nav class="breadcrumbs content-wrap" class:breadcrumbs--on-dark={onDark} aria-label="Breadcrumb">
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

	/* On-dark variant: breadcrumbs laid over a hero photograph. */
	.breadcrumbs--on-dark .breadcrumbs__item::after {
		color: rgba(245, 241, 232, 0.45);
	}

	.breadcrumbs--on-dark .breadcrumbs__item a {
		color: rgba(245, 241, 232, 0.85);
		transition: color var(--duration-hover) var(--ease);
	}

	.breadcrumbs--on-dark .breadcrumbs__item a:hover,
	.breadcrumbs--on-dark .breadcrumbs__item a:focus-visible {
		color: var(--gold);
		text-decoration: none;
	}

	.breadcrumbs--on-dark .breadcrumbs__item span {
		color: var(--on-green);
	}
</style>
