<script lang="ts">
	import type { PublicContent } from '$lib/sanity/transforms';
	import { cleanFeatureLabels } from '$lib/listing/featureHighlights';
	import FeatureLattice from './FeatureLattice.svelte';

	type Props = {
		content: PublicContent | null | undefined;
	};

	let { content }: Props = $props();

	/* The editor-curated standout features, authored and ordered in Sanity's
	   `featureHighlights` field ("handpicked … shown prominently"). We surface the
	   `label` only — `value` carries internal enrichment detail and never ships.
	   Order is the editor's; we preserve it, dedupe, and clean the stray provenance
	   suffix — shared with the Features search facet so the grid and filter align. */
	const highlights = $derived(
		cleanFeatureLabels((content?.featureHighlights ?? []).map((highlight) => highlight?.label))
	);
</script>

<FeatureLattice heading="Highlights" headingId="highlights-heading" items={highlights} />
