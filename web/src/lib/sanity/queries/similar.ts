import { defineQuery } from 'groq';
import { MEDIA_ASSET_PUBLIC, PRICING_PUBLIC, PROPERTY_CARD_PUBLIC } from '../allowlists';
import {
	toSimilarListingCards,
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

const MANUAL_SIMILAR_DEREF_FILTER = /* groq */ `
  (_type == "propertyListing" && listingKind in ["property", "unit"] && ${PUBLIC_LISTING_FILTER})
  || (_type == "development" && ${PUBLIC_LISTING_FILTER})
`;

/** Unified manual deref shape — TypeScript discriminates on `_type`. */
const MANUAL_SIMILAR_PROJECTION = /* groq */ `{
  _type,
  _id,
  ghiListingId,
  publicTitle,
  "slug": slug.current,
  listingKind,
  propertyType,
  transactionType,
  developmentDisplayMode,
  developmentStatus,
  location{
    country->{ name, "slug": slug.current },
    location->{ name, "slug": slug.current },
    community->{ name, "slug": slug.current },
    addressDisplay
  },
  pricing${PRICING_PUBLIC},
  specs{
    bedrooms,
    bathrooms,
    builtArea,
    builtAreaUnit
  },
  media{
    heroImage${MEDIA_ASSET_PUBLIC},
    thumbnailOverride${MEDIA_ASSET_PUBLIC}
  }
}`;

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

/** Tag overlap similar listings — ordered by shared tag count. */
export const tagsSimilarPropertiesQuery = defineQuery(`
  *[
    ${LISTING_BASE}
    && _id != $excludeId
    && count((related.similarityTags)[@ in $tags]) > 0
  ] | order(count((related.similarityTags)[@ in $tags]) desc, _createdAt desc)[0...$limit]${PROPERTY_CARD_PUBLIC}
`);

/** Manual similar picks with public gates — editor order preserved. */
export const manualSimilarPropertiesQuery = defineQuery(`
  *[_id == $listingId][0]{
    "items": related.manualSimilarProperties[]->[
      ${MANUAL_SIMILAR_DEREF_FILTER}
    ]${MANUAL_SIMILAR_PROJECTION}
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

	const raw = await fetchPublic<RawPropertyCard[]>(tagsSimilarPropertiesQuery, {
		params: {
			excludeId: listingId,
			tags,
			limit: SIMILAR_LISTING_LIMIT
		}
	});

	return (raw ?? []).map((row) => ({ kind: 'property' as const, card: toPublicPropertyCard(row) }));
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

	return fetchAutomaticSimilarCards(input);
}
