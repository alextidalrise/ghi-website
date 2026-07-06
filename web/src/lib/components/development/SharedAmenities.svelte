<script lang="ts">
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import FeatureLattice from '$lib/components/property/FeatureLattice.svelte';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	/* Development-wide amenities (spa, restaurant, gym …), authored in the dedicated
	   `sharedAmenities` field. We surface the `label` only — matching the property
	   Highlights lattice; `value` carries internal detail and never ships. */
	const amenities = $derived.by((): string[] => {
		const seen = new Set<string>();
		const out: string[] = [];
		for (const amenity of development.sharedAmenities ?? []) {
			const label = amenity?.label?.trim();
			if (!label) continue;
			const key = label.toLowerCase();
			if (seen.has(key)) continue;
			seen.add(key);
			out.push(label);
		}
		return out;
	});
</script>

<FeatureLattice
	heading="Shared amenities"
	headingId="shared-amenities-heading"
	items={amenities}
	sectionClass="content-wrap"
/>
