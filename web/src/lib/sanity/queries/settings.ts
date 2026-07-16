import { defineQuery } from 'groq';
import {
	FEATURED_LOCATION_PROJECTION,
	FEATURED_LOCATION_REF_FILTER,
	MEDIA_ASSET_PUBLIC
} from '../allowlists';
import { fetchPublic } from './fetch';
import {
	DEFAULT_FEATURE_FILTER,
	type FeatureFilterSettings
} from '$lib/listing/featureHighlights';
import type { MediaAssetInput } from '../transforms/mediaFilter';
import {
	toCountryCards,
	toLocationCards,
	type CountryFeatureCard,
	type FeaturedLocationCard,
	type HomepageHero,
	type TaxonomyWithHero
} from '../transforms/taxonomyHero';

export const siteSettingsHeroQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    homepageHero{
      image${MEDIA_ASSET_PUBLIC},
      tagline
    }
  }
`);

export const homepageFeaturedLocationsQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0]{
    "locations": homepageFeaturedLocations[
      ${FEATURED_LOCATION_REF_FILTER}
    ]->${FEATURED_LOCATION_PROJECTION}
  }
`);

// The country selector is flag-led, not photo-led: it no longer requires (or projects)
// heroImage. flagUrl dereferences the linked flag asset to its raw URL so the SVG ships
// crisp and un-rasterised; a country with no flag yet still renders via a built-in stamp.
export const countriesWithHeroQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && defined(slug.current)
  ] | order(name asc){
    name,
    "slug": slug.current,
    tagline,
    "flagUrl": flag.asset->url
  }
`);

export async function fetchSiteSettingsHero(): Promise<HomepageHero | null> {
	const result = await fetchPublic<{ homepageHero?: HomepageHero | null }>(siteSettingsHeroQuery);
	return result?.homepageHero ?? null;
}

export const featureFilterSettingsQuery = defineQuery(`
  *[_type == "siteSettings" && _id == "siteSettings"][0].featureFilter{
    minCount,
    optionsLimit,
    blocklist,
    allowlist
  }
`);

type FeatureFilterSettingsRaw = {
	minCount?: number | null;
	optionsLimit?: number | null;
	blocklist?: Array<string | null> | null;
	allowlist?: Array<string | null> | null;
} | null;

const cleanLabelList = (list: Array<string | null> | null | undefined): string[] =>
	(list ?? []).filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '');

/**
 * Editor-managed controls for the Features search facet (Sanity site settings). Any field
 * left unset falls back to its built-in default, so the filter always has sane behaviour
 * before an editor ever touches these settings.
 */
export async function fetchFeatureFilterSettings(): Promise<FeatureFilterSettings> {
	const raw = await fetchPublic<FeatureFilterSettingsRaw>(featureFilterSettingsQuery);
	return {
		minCount:
			typeof raw?.minCount === 'number' && raw.minCount >= 1
				? Math.floor(raw.minCount)
				: DEFAULT_FEATURE_FILTER.minCount,
		optionsLimit:
			typeof raw?.optionsLimit === 'number' && raw.optionsLimit >= 1
				? Math.floor(raw.optionsLimit)
				: DEFAULT_FEATURE_FILTER.optionsLimit,
		blocklist: cleanLabelList(raw?.blocklist),
		allowlist: cleanLabelList(raw?.allowlist)
	};
}

export async function fetchHomepageFeaturedLocations(): Promise<FeaturedLocationCard[]> {
	const result = await fetchPublic<{ locations?: Array<TaxonomyWithHero | null> | null }>(
		homepageFeaturedLocationsQuery
	);
	return toLocationCards(result?.locations);
}

export async function fetchCountriesWithHero(): Promise<CountryFeatureCard[]> {
	const raw = await fetchPublic<Array<TaxonomyWithHero | null>>(countriesWithHeroQuery);
	return toCountryCards(raw);
}

export const locationHeroesBySlugQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "location"
    && defined(slug.current)
    && slug.current in $slugs
  ]{
    "slug": slug.current,
    heroImage${MEDIA_ASSET_PUBLIC}
  }
`);

export type LocationHeroBySlug = { slug: string | null; heroImage?: MediaAssetInput | null };

/**
 * Fetch the hero image for a hand-picked set of location slugs so pages outside the
 * taxonomy tree (e.g. /about) can reuse the same optimized CDN heroes rather than
 * shipping raw static JPEGs. Returns the heroImage asset keyed by slug; pages build
 * their own crops via the image helpers.
 */
export async function fetchLocationHeroesBySlug(slugs: string[]): Promise<LocationHeroBySlug[]> {
	const result = await fetchPublic<LocationHeroBySlug[]>(locationHeroesBySlugQuery, {
		params: { slugs }
	});
	return result ?? [];
}
