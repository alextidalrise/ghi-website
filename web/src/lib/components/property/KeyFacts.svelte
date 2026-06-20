<script lang="ts">
	import type { PublicPropertyListing } from '$lib/sanity/transforms';

	type Props = {
		listing: PublicPropertyListing;
	};

	let { listing }: Props = $props();

	type Fact = { label: string; value: string };

	/** The at-a-glance spec row. Price lives in the summary header and statuses
	    in the header badges, so this stays purely quantitative. */
	const facts = $derived.by((): Fact[] => {
		const items: Fact[] = [];
		const specs = listing.specs as Record<string, unknown> | null | undefined;

		// Built is the default; treat an unset value (legacy listings) as Built too.
		const buildStatus = specs?.buildStatus as string | undefined;
		items.push({ label: 'Build status', value: buildStatus === 'off_plan' ? 'Off-Plan' : 'Built' });

		if (specs?.bedrooms != null) items.push({ label: 'Bedrooms', value: String(specs.bedrooms) });
		if (specs?.bathrooms != null) items.push({ label: 'Bathrooms', value: String(specs.bathrooms) });

		if (specs?.builtArea != null) {
			const unit = (specs.builtAreaUnit as string | undefined) ?? 'sqm';
			const unitLabel = unit === 'sqft' ? 'sq ft' : 'm²';
			items.push({ label: 'Built', value: `${specs.builtArea} ${unitLabel}` });
		}

		if (specs?.plotSize != null) {
			const unit = (specs.plotSizeUnit as string | undefined) ?? 'sqm';
			const unitLabel = unit === 'sqft' ? 'sq ft' : 'm²';
			items.push({ label: 'Plot', value: `${specs.plotSize} ${unitLabel}` });
		}

		const orientation = specs?.orientation as string | undefined;
		if (orientation && orientation !== 'unknown') {
			// Stored as enum slugs (e.g. "south_west"); present as "South-west".
			const label = orientation.replace(/_/g, '-');
			items.push({ label: 'Orientation', value: label.charAt(0).toUpperCase() + label.slice(1) });
		}

		// Only surface the course on frontline-golf properties.
		if (listing.golf?.golfRelevance === 'frontline_golf') {
			const courseName = listing.golf?.linkedGolfCourses?.[0]?.name;
			if (courseName) items.push({ label: 'Frontline golf course', value: courseName });
		}

		if (listing.ghiListingId) items.push({ label: 'Listing ID', value: listing.ghiListingId });

		return items;
	});
</script>

{#if facts.length > 0}
	<section class="key-facts" aria-label="Key facts">
		<dl class="key-facts__strip">
			{#each facts as fact (fact.label + fact.value)}
				<div class="key-facts__item">
					<dt>{fact.label}</dt>
					<dd>{fact.value}</dd>
				</div>
			{/each}
		</dl>
	</section>
{/if}

<style>
	.key-facts {
		padding-block: var(--space-md);
	}

	/* A light hairline-ruled spec row, not a boxed panel. Items wrap on narrow
	   widths; the gap carries the separation. */
	.key-facts__strip {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md) var(--space-xl);
		padding-block: var(--space-md);
		border-block: 1px solid var(--border);
	}

	.key-facts__item {
		flex: 0 1 auto;
	}

	.key-facts__item dt {
		font-size: var(--text-overline);
		font-weight: 500;
		letter-spacing: var(--tracking-overline);
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 0.35rem;
	}

	.key-facts__item dd {
		font-family: var(--serif);
		font-size: 1.25rem;
		color: var(--green);
		line-height: 1.2;
	}
</style>
