import { defineQuery } from 'groq';
import { DEVELOPMENT_CARD_PUBLIC, LISTING_CARD_UNION, PROPERTY_CARD_PUBLIC } from '../allowlists';
import {
	toPublicDevelopmentCard,
	toSimilarListingCards,
	type RawDevelopmentCard,
	type RawSimilarListingItem,
	type SimilarListingCard
} from '../transforms/similarListingCard';
import { toPublicPropertyCard, type RawPropertyCard } from '../transforms/propertyCard';
import { fetchPublic } from './fetch';
import { PUBLIC_LISTING_FILTER } from './filters';

export const SIMILAR_LISTING_LIMIT = 4;

export type SimilarPropertiesMode = 'automatic' | 'manual' | 'tags' | 'disabled';

const LISTING_BASE = /* groq */ `
  _type == "propertyListing"
  && listingKind in ["property", "unit"]
  && ${PUBLIC_LISTING_FILTER}
`;

const DEVELOPMENT_BASE = /* groq */ `
  _type == "development"
  && ${PUBLIC_LISTING_FILTER}
`;

// Either listing kind — property/unit listings or whole developments. Tags and manual are
// explicit editorial signals, so they cross type boundaries (a shared tag or hand-pick can
// link a property to a development); automatic stays type-scoped by design.
const ANY_LISTING_BASE = /* groq */ `
  (
    (_type == "propertyListing" && listingKind in ["property", "unit"])
    || _type == "development"
  )
  && ${PUBLIC_LISTING_FILTER}
`;

// Gate the referenced picks by type + publish status BEFORE dereferencing. A filter
// bracket placed after the `->` deref operator (`manualSimilarProperties[]->[...]`)
// collapses every element to null in GROQ, so the type/publish fields are read off the
// reference target via `@->` and the deref happens on the surviving refs.
const MANUAL_SIMILAR_DEREF_FILTER = /* groq */ `
  (@->_type == "propertyListing" && @->listingKind in ["property", "unit"] && (coalesce(@->status, "") == $publishedStatus || $previewAll))
  || (@->_type == "development" && (coalesce(@->status, "") == $publishedStatus || $previewAll))
`;

/** Automatic similar listings — same community and property type. */
export const automaticSimilarPropertiesQuery = defineQuery(`
  *[
    ${LISTING_BASE}
    && _id != $excludeId
    && propertyType == $propertyType
    && location.country->slug.current == $countrySlug
    && location.location->slug.current == $locationSlug
    && location.community->slug.current == $communitySlug
  ] | order(_createdAt desc)[0...$limit]${PROPERTY_CARD_PUBLIC}
`);

/**
 * Automatic similar developments — other published developments in the same country,
 * ordered by taxonomy proximity: same community first, then same location/area, then
 * newest. Developments frequently sit alone in their community (e.g. a catch-all that
 * defines its own location), so the strict same-community match used for properties would
 * usually return nothing; widening to the country with proximity ordering keeps the rail
 * populated with the closest available peers.
 */
export const automaticSimilarDevelopmentsQuery = defineQuery(`
  *[
    ${DEVELOPMENT_BASE}
    && _id != $excludeId
    && location.country->slug.current == $countrySlug
  ] | order(
    select(location.community->slug.current == $communitySlug => 0, 1) asc,
    select(location.location->slug.current == $locationSlug => 0, 1) asc,
    _createdAt desc
  )[0...$limit]${DEVELOPMENT_CARD_PUBLIC}
`);

/** Tag overlap similar listings — properties and developments, ordered by shared tag count. */
export const tagsSimilarPropertiesQuery = defineQuery(`
  *[
    ${ANY_LISTING_BASE}
    && _id != $excludeId
    && count((related.similarityTags)[@ in $tags]) > 0
  ] | order(count((related.similarityTags)[@ in $tags]) desc, _createdAt desc)[0...$limit]${LISTING_CARD_UNION}
`);

/** Manual similar picks with public gates — editor order preserved. */
export const manualSimilarPropertiesQuery = defineQuery(`
  *[_id == $listingId][0]{
    "items": related.manualSimilarProperties[
      ${MANUAL_SIMILAR_DEREF_FILTER}
    ]->${LISTING_CARD_UNION}
  }
`);

/** Server-only config for tags mode (tags not on public page transform). */
export const similarTagsConfigQuery = defineQuery(`
  *[_id == $listingId][0]{
    "tags": coalesce(related.similarityTags, [])
  }
`);

export type SimilarListingLocation = {
	country?: { slug?: string | null } | null;
	location?: { slug?: string | null } | null;
	community?: { slug?: string | null } | null;
};

export type FetchSimilarListingCardsInput = {
	listingId: string;
	mode?: string | null;
	/** Subject listing kind — routes automatic matching. Developments match other
	    developments; anything else falls through to the property matcher. */
	kind?: 'property' | 'development';
	propertyType?: string | null;
	location?: SimilarListingLocation | null;
};

function resolveMode(mode?: string | null): SimilarPropertiesMode {
	if (mode === 'disabled' || mode === 'manual' || mode === 'tags' || mode === 'automatic') {
		return mode;
	}
	return 'automatic';
}

function communitySlugs(location?: SimilarListingLocation | null) {
	const countrySlug = location?.country?.slug;
	const locationSlug = location?.location?.slug;
	const communitySlug = location?.community?.slug;

	if (!countrySlug || !locationSlug || !communitySlug) {
		return null;
	}

	return { countrySlug, locationSlug, communitySlug };
}

async function fetchAutomaticSimilarCards({
	listingId,
	propertyType,
	location
}: FetchSimilarListingCardsInput): Promise<SimilarListingCard[]> {
	const slugs = communitySlugs(location);
	if (!propertyType || !slugs) {
		return [];
	}

	const raw = await fetchPublic<RawPropertyCard[]>(automaticSimilarPropertiesQuery, {
		params: {
			excludeId: listingId,
			propertyType,
			...slugs,
			limit: SIMILAR_LISTING_LIMIT
		}
	});

	return (raw ?? []).map((row) => ({ kind: 'property' as const, card: toPublicPropertyCard(row) }));
}

async function fetchAutomaticSimilarDevelopmentCards({
	listingId,
	location
}: FetchSimilarListingCardsInput): Promise<SimilarListingCard[]> {
	const countrySlug = location?.country?.slug;
	if (!countrySlug) {
		return [];
	}

	const raw = await fetchPublic<RawDevelopmentCard[]>(automaticSimilarDevelopmentsQuery, {
		params: {
			excludeId: listingId,
			countrySlug,
			// Proximity tiebreaks — may be absent for sparse taxonomies; a null just never
			// matches, dropping that development to the newest-first tail.
			locationSlug: location?.location?.slug ?? null,
			communitySlug: location?.community?.slug ?? null,
			limit: SIMILAR_LISTING_LIMIT
		}
	});

	return (raw ?? []).map((row) => ({
		kind: 'development' as const,
		card: toPublicDevelopmentCard(row)
	}));
}

async function fetchTagsSimilarCards({
	listingId,
	tags
}: {
	listingId: string;
	tags: string[];
}): Promise<SimilarListingCard[]> {
	if (tags.length === 0) {
		return [];
	}

	const raw = await fetchPublic<Array<RawSimilarListingItem | null>>(tagsSimilarPropertiesQuery, {
		params: {
			excludeId: listingId,
			tags,
			limit: SIMILAR_LISTING_LIMIT
		}
	});

	return toSimilarListingCards(raw, { excludeId: listingId, limit: SIMILAR_LISTING_LIMIT });
}

async function fetchManualSimilarCards({
	listingId
}: {
	listingId: string;
}): Promise<SimilarListingCard[]> {
	const result = await fetchPublic<{ items?: Array<RawSimilarListingItem | null> | null }>(
		manualSimilarPropertiesQuery,
		{ params: { listingId } }
	);

	return toSimilarListingCards(result?.items, {
		excludeId: listingId,
		limit: SIMILAR_LISTING_LIMIT
	});
}

/**
 * Related listing cards for the property detail page.
 * Reads mode from public SEO; fetches manual/tags config server-side when needed.
 */
export async function fetchSimilarListingCards(
	input: FetchSimilarListingCardsInput
): Promise<SimilarListingCard[]> {
	const mode = resolveMode(input.mode);

	if (mode === 'disabled') {
		return [];
	}

	if (mode === 'manual') {
		return fetchManualSimilarCards({ listingId: input.listingId });
	}

	if (mode === 'tags') {
		const config = await fetchPublic<{ tags?: string[] | null }>(similarTagsConfigQuery, {
			params: { listingId: input.listingId }
		});
		return fetchTagsSimilarCards({
			listingId: input.listingId,
			tags: (config?.tags ?? []).filter(Boolean)
		});
	}

	if (input.kind === 'development') {
		return fetchAutomaticSimilarDevelopmentCards(input);
	}

	return fetchAutomaticSimilarCards(input);
}
