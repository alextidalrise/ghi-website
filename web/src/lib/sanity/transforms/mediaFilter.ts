export type MediaAssetInput = {
	asset?: { _ref?: string; _type?: string; asset?: unknown } | null;
	fileAsset?: unknown;
	altText?: string | null;
};

/** Whether an asset may be used in public output (has an uploaded file). */
export function isPublicMediaAsset(asset: MediaAssetInput | null | undefined): boolean {
	return Boolean(asset?.asset || asset?.fileAsset);
}

/** Return a media item for public output, or null when no file is attached. */
export function filterMediaAsset<T extends MediaAssetInput>(
	asset: T | null | undefined
): T | null {
	if (!isPublicMediaAsset(asset) || !asset) {
		return null;
	}

	return asset;
}

export function filterMediaAssetList<T extends MediaAssetInput>(
	assets: T[] | null | undefined
): T[] {
	if (!Array.isArray(assets)) {
		return [];
	}

	return assets.map((item) => filterMediaAsset(item)).filter((item): item is T => item != null);
}

export type MediaBundleInput = {
	gallery?: MediaAssetInput[] | null;
	galleryGroups?: Array<{ title?: string; images?: MediaAssetInput[] | null }> | null;
	thumbnailOverride?: MediaAssetInput | null;
	floorplans?: MediaAssetInput[] | null;
	videoUrl?: string | null;
	virtualTourUrl?: string | null;
	brochure?: MediaAssetInput | null;
	brochurePublic?: boolean | null;
};

export type PublicMediaBundle = {
	gallery: ReturnType<typeof filterMediaAssetList>;
	galleryGroups: Array<{ title?: string; images: ReturnType<typeof filterMediaAssetList> }>;
	thumbnailOverride: ReturnType<typeof filterMediaAsset> | null;
	floorplans: ReturnType<typeof filterMediaAssetList>;
	videoUrl: string | null;
	virtualTourUrl: string | null;
	brochure: ReturnType<typeof filterMediaAsset> | null;
	brochurePublic: boolean;
};

/** First public gallery image, then thumbnail override — used for hero, cards, and OG fallbacks. */
export function resolveListingHeroImage(
	media: MediaBundleInput | null | undefined
): ReturnType<typeof filterMediaAsset> | null {
	const gallery = filterMediaAssetList(media?.gallery);
	return gallery[0] ?? filterMediaAsset(media?.thumbnailOverride) ?? null;
}

/** Development hero — shared gallery images precede media.gallery (same order as the gallery UI). */
export function resolveDevelopmentHeroImage(
	media: MediaBundleInput | null | undefined,
	sharedGallery: MediaAssetInput[] | null | undefined
): ReturnType<typeof filterMediaAsset> | null {
	return resolveListingHeroImage({
		gallery: [...filterMediaAssetList(sharedGallery), ...filterMediaAssetList(media?.gallery)],
		thumbnailOverride: media?.thumbnailOverride
	});
}

/** Filter an entire mediaFields object for public rendering. */
export function filterMediaBundle(media: MediaBundleInput | null | undefined): PublicMediaBundle | null {
	if (!media) {
		return null;
	}

	const brochurePublic = media.brochurePublic === true;
	const includeBrochure = brochurePublic && isPublicMediaAsset(media.brochure ?? undefined);

	return {
		gallery: filterMediaAssetList(media.gallery),
		galleryGroups: (media.galleryGroups ?? []).map((group) => ({
			title: group.title,
			images: filterMediaAssetList(group.images)
		})),
		thumbnailOverride: filterMediaAsset(media.thumbnailOverride),
		floorplans: filterMediaAssetList(media.floorplans),
		videoUrl: media.videoUrl ?? null,
		virtualTourUrl: media.virtualTourUrl ?? null,
		brochure: includeBrochure ? filterMediaAsset(media.brochure) : null,
		brochurePublic
	};
}
