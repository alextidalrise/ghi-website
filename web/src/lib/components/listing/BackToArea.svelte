<script lang="ts">
	import type { BreadcrumbItem } from '$lib/listing/breadcrumbs';

	type Props = {
		breadcrumbs: BreadcrumbItem[];
	};

	let { breadcrumbs }: Props = $props();

	// Country / location / community crumbs in breadcrumb order (broadest first) —
	// drops the first crumb (Home) and the last (the current page itself), leaving
	// the ancestor areas the visitor can jump back up to.
	const backLinks = $derived(
		breadcrumbs
			.slice(1, -1)
			.filter((item): item is { label: string; href: string } => Boolean(item.href))
	);
</script>

{#if backLinks.length > 0}
	<nav class="back-to content-wrap" aria-label="Back to area">
		<span class="back-to__label">Back to</span>
		<ul class="back-to__list">
			{#each backLinks as link (link.href)}
				<li><a class="back-to__link" href={link.href}>{link.label}</a></li>
			{/each}
		</ul>
	</nav>
{/if}

<style>
	/* "Back to" area rail — quiet outline chips, square corners, no fills at rest. */
	.back-to {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-sm) var(--space-md);
		padding-block: var(--space-xl);
		border-top: 1px solid var(--border);
	}

	.back-to__label {
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
	}

	.back-to__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		list-style: none;
	}

	.back-to__link {
		display: inline-flex;
		padding: 0.55rem 1.1rem;
		border: 1px solid var(--border);
		color: var(--green);
		font-size: var(--text-ui);
		text-decoration: none;
		transition:
			border-color var(--duration-hover) var(--ease),
			color var(--duration-hover) var(--ease);
	}

	.back-to__link:hover,
	.back-to__link:focus-visible {
		border-color: var(--green);
		color: var(--charcoal);
	}
</style>
