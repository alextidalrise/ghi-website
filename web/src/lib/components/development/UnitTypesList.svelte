<script lang="ts">
	import { buildPublicImageUrl } from '$lib/sanity/image';
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { formatListingPrice } from '$lib/listing/formatPrice';
	import { formatEnumLabel } from '$lib/listing/developmentDisplay';

	type Props = {
		unitTypes: PublicDevelopment['unitTypes'];
		showPricing?: boolean;
	};

	let { unitTypes, showPricing = true }: Props = $props();

	type Specs = Record<string, unknown> | null | undefined;

	function specSummary(specs: Specs): string | null {
		if (!specs) return null;

		const parts: string[] = [];
		if (specs.bedrooms != null) parts.push(`${specs.bedrooms} bed`);
		if (specs.bathrooms != null) parts.push(`${specs.bathrooms} bath`);

		if (specs.builtArea != null) {
			const unit = (specs.builtAreaUnit as string | undefined) ?? 'sqm';
			const unitLabel = unit === 'sqft' ? 'sq ft' : 'm²';
			parts.push(`${specs.builtArea} ${unitLabel}`);
		}

		return parts.length > 0 ? parts.join(' · ') : null;
	}
</script>

{#if unitTypes.length > 0}
	<section class="inventory content-wrap" aria-labelledby="unit-types-heading">
		<h2 id="unit-types-heading">Unit types</h2>
		<ul class="inventory__list">
			{#each unitTypes as unitType (unitType._id)}
				{@const name = unitType.unitTypeName ?? 'Unit type'}
				{@const specs = unitType.specs as Specs}
				{@const price = showPricing ? formatListingPrice(unitType.pricing) : null}
				{@const availability = formatEnumLabel(unitType.pricing?.availabilityStatus)}
				{@const floorplan = unitType.floorplans?.[0]}
				{@const floorplanUrl = buildPublicImageUrl(floorplan, {
					width: 480,
					height: 320,
					fit: 'crop',
					quality: 80
				})}
				<li class="inventory__item">
					{#if floorplanUrl}
						<img
							class="inventory__thumb"
							src={floorplanUrl}
							alt={floorplan?.altText ?? `${name} floorplan`}
							width="480"
							height="320"
							loading="lazy"
						/>
					{/if}
					<div class="inventory__body">
						<h3>{name}</h3>
						{#if specSummary(specs)}
							<p class="inventory__specs">{specSummary(specs)}</p>
						{/if}
						<div class="inventory__meta">
							{#if price}
								<span class="inventory__price tabular-nums">{price}</span>
							{/if}
							{#if availability}
								<span>{availability}</span>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.inventory {
		padding-block: var(--space-xl);
	}

	.inventory h2 {
		margin-bottom: var(--space-md);
	}

	.inventory__list {
		display: grid;
		gap: var(--space-md);
		list-style: none;
	}

	.inventory__item {
		display: grid;
		grid-template-columns: minmax(0, 8rem) minmax(0, 1fr);
		gap: var(--space-md);
		padding: var(--space-md);
		border: 1px solid var(--border);
		background: var(--white);
	}

	@media (min-width: 640px) {
		.inventory__item {
			grid-template-columns: minmax(0, 12rem) minmax(0, 1fr);
		}
	}

	.inventory__thumb {
		width: 100%;
		aspect-ratio: 3 / 2;
		object-fit: cover;
		border: 1px solid var(--border);
	}

	.inventory__body h3 {
		font-family: var(--serif);
		font-size: 1.25rem;
		color: var(--green);
		margin-bottom: 0.35rem;
	}

	.inventory__specs {
		font-size: var(--text-ui);
		color: var(--muted);
		margin-bottom: 0.5rem;
	}

	.inventory__meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem 1rem;
		font-size: var(--text-small);
		text-transform: uppercase;
		letter-spacing: var(--tracking-wide);
		color: var(--muted);
	}

	.inventory__price {
		color: var(--green);
		font-weight: 500;
	}
</style>
