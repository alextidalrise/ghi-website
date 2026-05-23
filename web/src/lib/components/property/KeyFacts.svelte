<script lang="ts">
	import type { PublicPropertyListing } from '$lib/sanity/transforms';
	import { formatListingPrice } from '$lib/listing/formatPrice';

	type Props = {
		listing: PublicPropertyListing;
	};

	let { listing }: Props = $props();

	type Fact = { label: string; value: string };

	const facts = $derived.by((): Fact[] => {
		const items: Fact[] = [];
		const specs = listing.specs as Record<string, unknown> | null | undefined;
		const pricing = listing.pricing;

		const price = formatListingPrice(pricing);
		if (price) items.push({ label: 'Price', value: price });

		if (specs?.bedrooms != null) items.push({ label: 'Bedrooms', value: String(specs.bedrooms) });
		if (specs?.bathrooms != null) items.push({ label: 'Bathrooms', value: String(specs.bathrooms) });

		if (specs?.builtArea != null) {
			const unit = (specs.builtAreaUnit as string | undefined) ?? 'sqm';
			const unitLabel = unit === 'sqft' ? 'sq ft' : 'm²';
			items.push({ label: 'Built area', value: `${specs.builtArea} ${unitLabel}` });
		}

		if (specs?.plotSize != null) {
			const unit = (specs.plotSizeUnit as string | undefined) ?? 'sqm';
			const unitLabel = unit === 'sqft' ? 'sq ft' : 'm²';
			items.push({ label: 'Plot', value: `${specs.plotSize} ${unitLabel}` });
		}

		if (pricing?.availabilityStatus) {
			items.push({
				label: 'Availability',
				value: String(pricing.availabilityStatus).replace(/_/g, ' ')
			});
		}

		if (pricing?.completionStatus) {
			items.push({
				label: 'Completion',
				value: String(pricing.completionStatus).replace(/_/g, ' ')
			});
		}

		for (const highlight of listing.content?.featureHighlights ?? []) {
			if (!highlight?.label) continue;
			const value = highlight.value ?? 'Yes';
			items.push({ label: highlight.label, value });
		}

		return items;
	});
</script>

{#if facts.length > 0}
	<section class="key-facts" aria-labelledby="key-facts-heading">
		<div class="content-wrap">
			<h2 id="key-facts-heading" class="key-facts__heading">Key facts</h2>
			<dl class="key-facts__grid">
				{#each facts as fact (fact.label + fact.value)}
					<div class="key-facts__item">
						<dt>{fact.label}</dt>
						<dd>{fact.value}</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>
{/if}

<style>
	.key-facts {
		background: var(--linen);
		padding-block: var(--space-xl);
		border-block: 1px solid var(--border);
	}

	.key-facts__heading {
		font-family: var(--serif);
		font-size: var(--text-h3);
		color: var(--green);
		margin-bottom: var(--space-md);
	}

	.key-facts__grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 14rem), 1fr));
		gap: var(--space-md) var(--space-lg);
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
		font-size: 1.125rem;
		color: var(--green);
		line-height: 1.3;
	}
</style>
