import { defineQuery } from 'groq';
import {
	FEATURED_LOCATION_PROJECTION,
	FEATURED_LOCATION_REF_FILTER,
	LOCATION_TAXONOMY_PUBLIC,
	MEDIA_ASSET_PUBLIC
} from '../allowlists';
import { fetchPublic } from './fetch';
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

export const countriesWithHeroQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && defined(slug.current)
    && defined(heroImage.asset)
  ] | order(name asc)${LOCATION_TAXONOMY_PUBLIC}
`);

export async function fetchSiteSettingsHero(): Promise<HomepageHero | null> {
	const result = await fetchPublic<{ homepageHero?: HomepageHero | null }>(siteSettingsHeroQuery);
	return result?.homepageHero ?? null;
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
