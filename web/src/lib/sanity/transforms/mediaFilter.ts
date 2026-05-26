export type MediaAssetInput = {
	asset?: { _ref?: string; _type?: string; asset?: unknown } | null;
	fileAsset?: unknown;
	assetCategory?: string | null;
	order?: number | null;
	altText?: string | null;
	caption?: string | null;
	assetBrandingType?: string | null;
	imageRightsStatus?: string | null;
	publicUseApproved?: boolean | null;
};

const BLOCKED_RIGHTS = new Set(['restricted', 'do_not_use', 'rejected']);

const GHI_BRANDED = new Set(['ghi_branded', 'unbranded']);

/** Whether an asset may be used in public output (query + transform gate). */
export function isPublicMediaAsset(asset: MediaAssetInput | null | undefined): boolean {
	if (!asset?.asset && !asset?.fileAsset) {
		return false;
	}

	const rights = asset.imageRightsStatus ?? 'source_pack_provided';
	if (BLOCKED_RIGHTS.has(rights)) {
		return false;
	}

	const branding = asset.assetBrandingType ?? 'unknown';
	if (!GHI_BRANDED.has(branding) && !asset.publicUseApproved) {
		return false;
	}

	return true;
}

/** Strip blocked assets and private governance fields from a single media item. */
export function filterMediaAsset<T extends MediaAssetInput>(
	asset: T | null | undefined
): Omit<T, 'imageRightsStatus' | 'publicUseApproved' | 'assetBrandingType'> | null {
	if (!isPublicMediaAsset(asset) || !asset) {
		return null;
	}

	const { imageRightsStatus: _rights, publicUseApproved: _approved, assetBrandingType: _branding, ...publicAsset } =
		asset;

	return publicAsset;
}

export function filterMediaAssetList<T extends MediaAssetInput>(
	assets: T[] | null | undefined
): Array<Omit<T, 'imageRightsStatus' | 'publicUseApproved' | 'assetBrandingType'>> {
	if (!Array.isArray(assets)) {
		return [];
	}

	return assets.map((item) => filterMediaAsset(item)).filter((item): item is NonNullable<typeof item> => item != null);
}

export type MediaBundleInput = {
	heroImage?: MediaAssetInput | null;
	gallery?: MediaAssetInput[] | null;
	galleryGroups?: Array<{ title?: string; images?: MediaAssetInput[] | null }> | null;
	thumbnailOverride?: MediaAssetInput | null;
	floorplans?: MediaAssetInput[] | null;
	videoUrl?: string | null;
	virtualTourUrl?: string | null;
	brochure?: MediaAssetInput | null;
	brochureVisibility?: string | null;
};

export type PublicMediaBundle = {
	heroImage: ReturnType<typeof filterMediaAsset> | null;
	gallery: ReturnType<typeof filterMediaAssetList>;
	galleryGroups: Array<{ title?: string; images: ReturnType<typeof filterMediaAssetList> }>;
	thumbnailOverride: ReturnType<typeof filterMediaAsset> | null;
	floorplans: ReturnType<typeof filterMediaAssetList>;
	videoUrl: string | null;
	virtualTourUrl: string | null;
	brochure: ReturnType<typeof filterMediaAsset> | null;
	brochureVisibility: string | null;
};

/** Filter an entire mediaFields object for public rendering. */
export function filterMediaBundle(media: MediaBundleInput | null | undefined): PublicMediaBundle | null {
	if (!media) {
		return null;
	}

	const brochureVisibility = media.brochureVisibility ?? 'request_only';
	const includeBrochure =
		brochureVisibility === 'public_approved' && isPublicMediaAsset(media.brochure ?? undefined);

	return {
		heroImage: filterMediaAsset(media.heroImage),
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
		brochureVisibility
	};
}
