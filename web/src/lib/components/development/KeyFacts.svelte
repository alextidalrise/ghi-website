<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import { formatEnumLabel } from '$lib/listing/developmentDisplay';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	type Fact = { label: string; value: string };

	function num(value: unknown): number | null {
		return typeof value === 'number' ? value : null;
	}

	/** Compact value across all units: a single figure, or a "min–max" range. */
	function range(values: number[], suffix = ''): string | null {
		if (values.length === 0) return null;
		const min = Math.min(...values);
		const max = Math.max(...values);
		const fmt = (n: number) => n.toLocaleString('en-GB');
		return min === max ? `${fmt(min)}${suffix}` : `${fmt(min)}–${fmt(max)}${suffix}`;
	}

	/** The at-a-glance strip mirrors the property page: purely quantitative, derived
	    from the development's available units, with completion + developer context. */
	const facts = $derived.by((): Fact[] => {
		const items: Fact[] = [];
		const units = development.units ?? [];

		const beds: number[] = [];
		const sizes: number[] = [];
		let areaUnit = 'm²';
		for (const unit of units) {
			const specs = (unit as Record<string, unknown>).specs as Record<string, unknown> | null;
			const b = num(specs?.bedrooms);
			if (b != null) beds.push(b);
			const a = num(specs?.builtArea);
			if (a != null) {
				sizes.push(a);
				if (specs?.builtAreaUnit === 'sqft') areaUnit = 'sq ft';
			}
		}

		const bedsRange = range(beds);
		if (bedsRange) items.push({ label: 'Bedrooms', value: bedsRange });

		const sizeRange = range(sizes, ` ${areaUnit}`);
		if (sizeRange) items.push({ label: 'Built', value: sizeRange });

		const completion = development.completionStatus ?? development.pricing?.completionStatus;
		if (completion && completion !== 'unknown') {
			items.push({ label: 'Completion', value: formatEnumLabel(completion) });
		}

		if (development.developerName) {
			items.push({ label: 'Developer', value: development.developerName });
		}

		const courseName = development.golf?.primaryGolfCourse?.name;
		if (courseName) items.push({ label: 'Golf course', value: courseName });

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
