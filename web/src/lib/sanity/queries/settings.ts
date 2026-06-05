import { defineQuery } from 'groq';
import { LOCATION_TAXONOMY_PUBLIC, MEDIA_ASSET_PUBLIC } from '../allowlists';
import { fetchPublic } from './fetch';
import {
	toCountryCards,
	toLocationCards,
	type CountryFeatureCard,
	type FeaturedLocationCard,
	type HomepageHero,
	type TaxonomyWithHero
} from '../transforms/taxonomyHero';

const FEATURED_LOCATION_REF_FILTER = /* groq */ `
  @->_type == "locationTaxonomy"
  && @->type == "location"
  && defined(@->slug.current)
  && defined(@->parent->slug.current)
`;

const FEATURED_LOCATION_PROJECTION = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  type,
  breadcrumbLabel,
  tagline,
  heroImage${MEDIA_ASSET_PUBLIC},
  "countrySlug": parent->slug.current,
  "countryName": parent->name
}`;

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
	const result = await fetchPublic<{ locations?: FeaturedLocationCard[] | null }>(
		homepageFeaturedLocationsQuery
	);
	return toLocationCards(result?.locations);
}

export async function fetchCountriesWithHero(): Promise<CountryFeatureCard[]> {
	const raw = await fetchPublic<Array<TaxonomyWithHero | null>>(countriesWithHeroQuery);
	return toCountryCards(raw);
}
