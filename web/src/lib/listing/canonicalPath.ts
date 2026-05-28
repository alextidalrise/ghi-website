export type CanonicalSegments = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
};

export function buildCanonicalPath({
	countrySlug,
	locationSlug,
	communitySlug,
	slug
}: CanonicalSegments): string | null {
	if (!countrySlug || !locationSlug || !communitySlug || !slug) {
		return null;
	}
	return `/${countrySlug}/${locationSlug}/${communitySlug}/${slug}`;
}

export type ListingHrefInput = {
	slug?: string | null;
	location?: {
		country?: { slug?: string | null } | null;
		location?: { slug?: string | null } | null;
		community?: { slug?: string | null } | null;
	} | null;
};

export function buildListingHref({ slug, location }: ListingHrefInput): string | null {
	return buildCanonicalPath({
		countrySlug: location?.country?.slug,
		locationSlug: location?.location?.slug,
		communitySlug: location?.community?.slug,
		slug
	});
}

export function pathsMatch(
	request: { countrySlug: string; locationSlug: string; communitySlug: string; slug: string },
	canonical: CanonicalSegments
): boolean {
	return (
		request.countrySlug === canonical.countrySlug &&
		request.locationSlug === canonical.locationSlug &&
		request.communitySlug === canonical.communitySlug &&
		request.slug === canonical.slug
	);
}
