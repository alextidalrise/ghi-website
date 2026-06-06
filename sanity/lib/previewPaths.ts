export type ListingPreviewSegments = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
	isCatchAll?: boolean | null;
};

export type TaxonomyPreviewInput = {
	type?: string | null;
	slug?: string | null;
	parentSlug?: string | null;
	grandparentSlug?: string | null;
};

/** Mirrors web/src/lib/listing/canonicalPath.ts — keep in sync. */
export function buildListingPreviewPath({
	countrySlug,
	locationSlug,
	communitySlug,
	slug,
	isCatchAll
}: ListingPreviewSegments): string | null {
	if (!countrySlug || !locationSlug || !slug) {
		return null;
	}

	if (isCatchAll === true) {
		return `/${countrySlug}/${locationSlug}/${slug}`;
	}

	if (!communitySlug) {
		return null;
	}

	return `/${countrySlug}/${locationSlug}/${communitySlug}/${slug}`;
}

export type GolfCoursePreviewSegments = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
};

export function buildGolfCoursePreviewPath({
	countrySlug,
	locationSlug,
	communitySlug,
	slug
}: GolfCoursePreviewSegments): string | null {
	if (!countrySlug || !locationSlug || !communitySlug || !slug) {
		return null;
	}
	return `/${countrySlug}/${locationSlug}/${communitySlug}/golf/${slug}`;
}

export function buildTaxonomyPreviewPath({
	type,
	slug,
	parentSlug,
	grandparentSlug
}: TaxonomyPreviewInput): string | null {
	if (!type || !slug) {
		return null;
	}

	switch (type) {
		case 'country':
			return `/${slug}`;
		case 'location':
			return parentSlug ? `/${parentSlug}/${slug}` : null;
		case 'community':
			return parentSlug && grandparentSlug
				? `/${grandparentSlug}/${parentSlug}?community=${encodeURIComponent(slug)}`
				: null;
		default:
			return null;
	}
}
