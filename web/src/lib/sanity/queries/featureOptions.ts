import {
	DEFAULT_FEATURE_FILTER,
	toFeatureOptions,
	type FeatureFilterSettings,
	type FeatureOption
} from '$lib/listing/featureHighlights';
import { fetchPublic } from './fetch';
import { PUBLIC_LISTING_FILTER } from './filters';

/**
 * Listing docs that can carry public feature highlights — the same surface the search
 * grid draws from (individual properties/units and whole developments).
 */
const FEATURE_LISTING_FILTER = /* groq */ `
  (
    (_type == "propertyListing" && listingKind in ["property", "unit"])
    || _type == "development"
  )
  && ${PUBLIC_LISTING_FILTER}
  && defined(content.featureHighlights)
`;

/** Raw highlight labels per listing — flattened + normalized into options in TS. */
const FEATURE_LABELS_PROJECTION = /* groq */ `{
  "labels": content.featureHighlights[defined(label)].label
}`;

/**
 * Highlight labels for the listings in a location scope. Scoped to the whole location
 * (country + grid locations), independent of the active community/other facets, so the
 * Features menu stays stable as the visitor filters.
 */
const locationFeatureLabelsQuery = /* groq */ `
  *[
    ${FEATURE_LISTING_FILTER}
    && location.country->slug.current == $countrySlug
    && location.location._ref in $locationIds
  ]${FEATURE_LABELS_PROJECTION}
`;

type FeatureLabelRow = { labels?: Array<string | null> | null };

/**
 * Auto-derived Features options for a location's listings (location results page). Applies
 * the same editor-managed Features-filter controls as the DiscoveryBar so the two surfaces
 * stay identical; pass the settings from `fetchFeatureFilterSettings` (defaults if omitted).
 */
export async function fetchLocationFeatureOptions(
	countrySlug: string,
	locationIds: string[],
	settings: FeatureFilterSettings = DEFAULT_FEATURE_FILTER
): Promise<FeatureOption[]> {
	const rows = await fetchPublic<FeatureLabelRow[]>(locationFeatureLabelsQuery, {
		params: { countrySlug, locationIds }
	});
	return toFeatureOptions((rows ?? []).flatMap((row) => row.labels ?? []), settings);
}
