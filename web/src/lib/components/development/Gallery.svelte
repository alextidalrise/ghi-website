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
			heroImage: base?.heroImage ?? shared[0] ?? null,
			gallery: [...(base?.gallery ?? []), ...shared],
			galleryGroups: base?.galleryGroups ?? [],
			thumbnailOverride: base?.thumbnailOverride ?? null,
			floorplans: base?.floorplans ?? [],
			videoUrl: base?.videoUrl ?? null,
			virtualTourUrl: base?.virtualTourUrl ?? null,
			brochure: base?.brochure ?? null,
			brochureVisibility: base?.brochureVisibility ?? development.brochureVisibility ?? 'request_only'
		};
	});
</script>

<Gallery media={media} title={development.title ?? 'Development'} />
