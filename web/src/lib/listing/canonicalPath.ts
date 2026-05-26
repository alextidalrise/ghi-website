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
