<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';

	type Props = {
		items: BreadcrumbItem[];
		/** Light treatment for breadcrumbs laid over a dark hero image. */
		onDark?: boolean;
		/** Drop the centered content-wrap gutter so the trail sits flush inside a column. */
		inline?: boolean;
		/**
		 * Hide the trailing current-page crumb. On property pages the title already
		 * headlines the column, so repeating it in the trail is redundant. The full
		 * trail (including the current page) still ships in the JSON-LD that the
		 * server builds separately, so search engines are unaffected.
		 */
		hideCurrent?: boolean;
	};

	let { items, onDark = false, inline = false, hideCurrent = false }: Props = $props();

	const visibleItems = $derived(hideCurrent && items.length > 1 ? items.slice(0, -1) : items);
</script>

<nav
	class="breadcrumbs"
	class:content-wrap={!inline}
	class:breadcrumbs--inline={inline}
	class:breadcrumbs--on-dark={onDark}
	aria-label="Breadcrumb"
>
	<ol class="breadcrumbs__list">
		{#each visibleItems as item, index (item.label + (item.href ?? index))}
			<li class="breadcrumbs__item">
				{#if item.href && (hideCurrent || index < visibleItems.length - 1)}
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

	/* Sits at the top of the property hero's info column: no top padding (it meets
	   the gallery's top edge), a small gap before the title below. */
	.breadcrumbs--inline {
		padding-block: 0 var(--space-sm);
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
