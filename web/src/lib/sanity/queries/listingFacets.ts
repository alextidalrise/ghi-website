import { fetchPublic } from './fetch';
import {
	LISTING_COMMUNITY_SLUG,
	LISTING_COUNTRY_SLUG,
	LISTING_LOCATION_SLUG,
	PUBLIC_CHILD_UNIT_FILTER,
	PUBLIC_LISTING_FILTER
} from './filters';

function normalizeFacetRows(rows: RawFacetRow[] | null): ListingFacetRow[] {
	return (rows ?? []).map((row) => ({
		countrySlug: row.countrySlug ?? null,
		locationSlug: row.locationSlug ?? null,
		communitySlug: row.communitySlug ?? null,
		propertyTypes: (row.propertyTypes ?? []).filter(
			(value): value is string => typeof value === 'string' && value.length > 0
		),
		price: typeof row.price === 'number' ? row.price : null,
		featureLabels: (row.featureLabels ?? []).filter(
			(value): value is string => typeof value === 'string'
		)
	}));
}

/**
 * Per-listing facet rows for the homepage search bar. The bar pre-loads these once
 * (like the community list) and narrows Property type / Budget / Features client-side
 * to what actually exists in the chosen location — no per-selection round-trip.
 */
const FACET_LISTING_FILTER = /* groq */ `
  (
    (_type == "propertyListing" && listingKind in ["property", "unit"])
    || _type == "development"
  )
  && ${PUBLIC_LISTING_FILTER}
`;

/**
 * Property type is unit-aware for developments (they inherit type from their visible
 * unit types), mirroring the search facet in listingSearch.ts. Price uses the same
 * `price ?? priceFrom` coalesce the grid sorts/filters on.
 */
const FACET_ROW_PROJECTION = /* groq */ `{
  "countrySlug": ${LISTING_COUNTRY_SLUG},
  "locationSlug": ${LISTING_LOCATION_SLUG},
  "communitySlug": ${LISTING_COMMUNITY_SLUG},
  "propertyTypes": select(
    _type == "development" => (unitTypes[]->)[${PUBLIC_CHILD_UNIT_FILTER}].propertyType,
    [propertyType]
  ),
  "price": coalesce(pricing.price, pricing.priceFrom),
  "featureLabels": content.featureHighlights[defined(label)].label
}`;

const facetRowsQuery = /* groq */ `
  *[${FACET_LISTING_FILTER}]${FACET_ROW_PROJECTION}
`;

/** Same rows narrowed to a single country — feeds the country page's scoped search bar,
    so a country page never pulls the whole catalogue's facets. */
const countryFacetRowsQuery = /* groq */ `
  *[${FACET_LISTING_FILTER} && ${LISTING_COUNTRY_SLUG} == $countrySlug]${FACET_ROW_PROJECTION}
`;

export type ListingFacetRow = {
	countrySlug: string | null;
	locationSlug: string | null;
	communitySlug: string | null;
	propertyTypes: string[];
	price: number | null;
	featureLabels: string[];
};

type RawFacetRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	propertyTypes?: Array<string | null> | null;
	price?: number | null;
	featureLabels?: Array<string | null> | null;
};

/** Facet rows for every public listing — feeds the homepage bar's location-aware menus. */
export async function fetchListingFacetRows(): Promise<ListingFacetRow[]> {
	return normalizeFacetRows(await fetchPublic<RawFacetRow[]>(facetRowsQuery));
}

/** Facet rows for one country — feeds the country page's scoped search bar. */
export async function fetchCountryListingFacetRows(countrySlug: string): Promise<ListingFacetRow[]> {
	return normalizeFacetRows(
		await fetchPublic<RawFacetRow[]>(countryFacetRowsQuery, { params: { countrySlug } })
	);
}
