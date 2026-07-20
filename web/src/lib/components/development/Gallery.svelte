<script lang="ts">
	import Gallery from '$lib/components/property/Gallery.svelte';
	import type { PublicDevelopment } from '$lib/sanity/transforms';
	import type { PublicMediaBundle } from '$lib/sanity/transforms/mediaFilter';

	type Props = {
		development: PublicDevelopment;
	};

	let { development }: Props = $props();

	const media = $derived.by((): PublicMediaBundle | null => {
		const base = development.media;
		const shared = development.sharedGallery ?? [];

		if (!base && shared.length === 0) {
			return null;
		}

		return {
			gallery: [...shared, ...(base?.gallery ?? [])],
			galleryGroups: base?.galleryGroups ?? [],
			thumbnailOverride: base?.thumbnailOverride ?? null,
			floorplans: base?.floorplans ?? [],
			videoUrl: base?.videoUrl ?? null,
			virtualTourUrl: base?.virtualTourUrl ?? null,
			brochure: base?.brochure ?? null,
			brochurePublic: base?.brochurePublic ?? false
		};
	});
</script>

<Gallery
	media={media}
	title={development.title ?? 'Development'}
	listingId={development.ghiListingId}
	surface="development"
/>
