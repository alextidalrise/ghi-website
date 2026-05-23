type CanonicalSegments = {
	countrySlug?: string | null;
	areaSlug?: string | null;
	slug?: string | null;
};

export function buildCanonicalPath({ countrySlug, areaSlug, slug }: CanonicalSegments): string | null {
	if (!countrySlug || !areaSlug || !slug) {
		return null;
	}
	return `/${countrySlug}/${areaSlug}/${slug}`;
}

export function pathsMatch(
	request: { countrySlug: string; areaSlug: string; slug: string },
	canonical: CanonicalSegments
): boolean {
	return (
		request.countrySlug === canonical.countrySlug &&
		request.areaSlug === canonical.areaSlug &&
		request.slug === canonical.slug
	);
}
