<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { formatListingPrice } from '$lib/listing/formatPrice';
	import {
		formatEnumLabel,
		shouldShowDevelopmentPricing,
		showsPriceSummary
	} from '$lib/listing/developmentDisplay';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	type Fact = { label: string; value: string };

	const facts = $derived.by((): Fact[] => {
		const items: Fact[] = [];
		const showPricing =
			shouldShowDevelopmentPricing(development.developmentDisplayMode) ||
			showsPriceSummary(development.developmentDisplayMode);

		if (showPricing) {
			const price = formatListingPrice(development.pricing);
			if (price) items.push({ label: 'Price', value: price });
		}

		if (development.availabilitySummary) {
			items.push({ label: 'Availability', value: development.availabilitySummary });
		}

		if (development.developmentStatus) {
			items.push({ label: 'Status', value: formatEnumLabel(development.developmentStatus) });
		}

		if (development.buildStatus) {
			items.push({ label: 'Build status', value: formatEnumLabel(development.buildStatus) });
		}

		if (development.completionStatus) {
			items.push({ label: 'Completion', value: formatEnumLabel(development.completionStatus) });
		}

		if (development.completionDate) {
			items.push({ label: 'Completion date', value: development.completionDate });
		}

		if (development.developerName) {
			items.push({ label: 'Developer', value: development.developerName });
		}

		if (development.architectureStudio) {
			items.push({ label: 'Architecture', value: development.architectureStudio });
		}

		for (const item of development.developmentComposition ?? []) {
			if (item) items.push({ label: 'Includes', value: item });
		}

		for (const highlight of development.content?.featureHighlights ?? []) {
			if (!highlight?.label) continue;
			items.push({ label: highlight.label, value: highlight.value ?? 'Yes' });
		}

		return items;
	});
</script>

{#if facts.length > 0}
	<section class="key-facts" aria-labelledby="development-key-facts-heading">
		<div class="content-wrap">
			<div class="key-facts__box">
				<h2 id="development-key-facts-heading" class="key-facts__heading">Key facts</h2>
				<dl class="key-facts__grid">
					{#each facts as fact (fact.label + fact.value)}
						<div class="key-facts__item">
							<dt>{fact.label}</dt>
							<dd>{fact.value}</dd>
						</div>
					{/each}
				</dl>
			</div>
		</div>
	</section>
{/if}

<style>
	.key-facts {
		padding-block: var(--space-xl);
	}

	.key-facts__box {
		border: 1px solid var(--border);
		padding: var(--space-xl);
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
