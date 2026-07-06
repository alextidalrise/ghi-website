<script lang="ts">
	import type { PublicContent } from '$lib/sanity/transforms';
	import FeatureLattice from './FeatureLattice.svelte';

	type Props = {
		content: PublicContent | null | undefined;
	};

	let { content }: Props = $props();

	/* The editor-curated standout features, authored and ordered in Sanity's
	   `featureHighlights` field ("handpicked … shown prominently"). We surface the
	   `label` only — `value` carries internal enrichment detail and never ships.
	   Order is the editor's; we preserve it, dedupe, and clean the one stray
	   provenance suffix the enrichment pipeline sometimes leaves behind. */
	const highlights = $derived.by((): string[] => {
		const seen = new Set<string>();
		const out: string[] = [];
		for (const highlight of content?.featureHighlights ?? []) {
			const label = highlight?.label
				?.trim()
				.replace(/[,\s]+per\s+source(?:\s+text)?\.?$/i, '')
				.trim();
			if (!label) continue;
			const key = label.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(label);
		}
		return out;
	});
</script>

<FeatureLattice heading="Highlights" headingId="highlights-heading" items={highlights} />
