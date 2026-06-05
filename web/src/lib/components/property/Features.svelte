<script lang="ts">
	import type { PublicContent } from '$lib/sanity/transforms';

	type Props = {
		content: PublicContent | null | undefined;
	};

	let { content }: Props = $props();

	const YES_VALUES = new Set(['yes', 'true', 'included', 'available']);

	/** Build the chip set from the curated amenities plus any boolean feature
	    highlights. Highlights whose value is descriptive (a sentence, a provenance
	    note like "Source PDF figures", measurements) are skipped: those carry
	    internal enrichment notes, not public-facing feature copy, and they don't
	    read as chips. A highlight is a feature only when its value is empty or a
	    boolean affirmation, in which case the label alone is the chip. */
	const features = $derived.by((): string[] => {
		const seen = new Set<string>();
		const out: string[] = [];

		const add = (raw: string | null | undefined) => {
			const label = raw?.trim();
			if (!label) return;
			const key = label.toLowerCase();
			if (seen.has(key)) return;
			seen.add(key);
			out.push(label);
		};

		for (const highlight of content?.featureHighlights ?? []) {
			const label = highlight?.label?.trim();
			if (!label) continue;
			const value = highlight.value?.trim();
			if (!value || YES_VALUES.has(value.toLowerCase())) {
				add(label);
			}
		}

		for (const amenity of content?.amenities ?? []) {
			add(amenity);
		}

		return out;
	});
</script>

{#if features.length > 0}
	<section class="features" aria-labelledby="features-heading">
		<h2 id="features-heading">Features</h2>
		<ul class="features__list">
			{#each features as feature (feature)}
				<li class="features__chip">{feature}</li>
			{/each}
		</ul>
	</section>
{/if}

<style>
	.features {
		padding-block: var(--space-xl);
	}

	.features h2 {
		margin-bottom: var(--space-md);
	}

	.features__list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		list-style: none;
	}

	.features__chip {
		font-size: var(--text-ui);
		padding: 0.5rem 0.9rem;
		border: 1px solid var(--border);
		color: var(--green);
		background: var(--white);
	}
</style>
