export type CanonicalSegments = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	slug?: string | null;
	isCatchAll?: boolean | null;
};

export function buildCanonicalPath({
	countrySlug,
	locationSlug,
	communitySlug,
	slug,
	isCatchAll
}: CanonicalSegments): string | null {
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

export type ListingHrefInput = {
	slug?: string | null;
	/** Pre-resolved segments from card/canonical queries (preferred when present). */
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
	location?: {
		country?: { slug?: string | null } | null;
		location?: { slug?: string | null } | null;
		community?: {
			_id?: string | null;
			slug?: string | null;
			isCatchAll?: boolean | null;
		} | null;
	} | null;
};

/** Derive a community slug from CMS slug or stable taxonomy _id prefixes. */
export function resolveCommunitySlug(
	community: { _id?: string | null; slug?: string | null } | null | undefined
): string | null {
	if (!community) return null;
	if (community.slug) return community.slug;

	const id = community._id;
	if (!id) return null;
	if (id.startsWith('places-community-')) {
		return id.slice('places-community-'.length);
	}
	if (id.startsWith('location.community.')) {
		return id.slice('location.community.'.length);
	}
	return null;
}

export function buildListingHref({
	slug,
	countrySlug,
	locationSlug,
	communitySlug,
	isCatchAll,
	location
}: ListingHrefInput): string | null {
	const resolvedIsCatchAll = isCatchAll ?? location?.community?.isCatchAll ?? false;

	return buildCanonicalPath({
		countrySlug: countrySlug ?? location?.country?.slug,
		locationSlug: locationSlug ?? location?.location?.slug,
		communitySlug: communitySlug ?? resolveCommunitySlug(location?.community),
		slug,
		isCatchAll: resolvedIsCatchAll
	});
}

export type PathMatchRequest = {
	countrySlug: string;
	locationSlug: string;
	communitySlug?: string;
	slug: string;
};

export function pathsMatch(request: PathMatchRequest, canonical: CanonicalSegments): boolean {
	if (canonical.isCatchAll === true) {
		return (
			request.countrySlug === canonical.countrySlug &&
			request.locationSlug === canonical.locationSlug &&
			request.slug === canonical.slug &&
			!request.communitySlug
		);
	}

	return (
		request.countrySlug === canonical.countrySlug &&
		request.locationSlug === canonical.locationSlug &&
		request.communitySlug === canonical.communitySlug &&
		request.slug === canonical.slug
	);
}
