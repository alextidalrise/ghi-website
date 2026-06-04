/**
 * Curated homepage content — interim static data.
 *
 * Imagery and copy here are placeholders chosen to ship the homepage layout now.
 * Replace with Sanity-driven content once the `locationTaxonomy` schema gains a
 * hero image, a one-line tagline, and a "feature on homepage" flag — at which
 * point these can be derived from the live taxonomy instead of hardcoded.
 *
 * Photos: Unsplash, downloaded to /static and swappable for real GHI photography.
 */

const ASSET_BASE = '/design-system/assets/locations';

export type CountryFeature = {
	name: string;
	href: string;
	image: string;
	alt: string;
	tagline: string;
};

export type LocationFeature = {
	name: string;
	countryLabel: string;
	href: string;
	image: string;
	alt: string;
	tagline: string;
};

export const COUNTRY_FEATURES: CountryFeature[] = [
	{
		name: 'Spain',
		href: '/spain',
		image: `${ASSET_BASE}/country-spain.jpg`,
		alt: 'A pine-topped cove on the Spanish Mediterranean coast at dusk',
		tagline: "The Costa del Sol's Golf Valley, Sotogrande, and the southern coast."
	},
	{
		name: 'Portugal',
		href: '/portugal',
		image: `${ASSET_BASE}/country-portugal.jpg`,
		alt: 'Golden limestone cliffs above turquoise water on the Algarve coast',
		tagline: 'The Algarve fairways, the Lisbon coast, and the Atlantic south.'
	}
];

/** Country landing-page hero headline — aligned with keyword map primary titles. */
export function countryHeadline(name: string): string {
	return `Golf property for sale in ${name}`;
}

export function countryFeatureBySlug(slug: string): CountryFeature | undefined {
	return COUNTRY_FEATURES.find((country) => country.href === `/${slug}`);
}

export function locationFeaturesForCountry(countryName: string): LocationFeature[] {
	return LOCATION_FEATURES.filter((location) => location.countryLabel === countryName);
}

export const LOCATION_FEATURES: LocationFeature[] = [
	{
		name: 'Marbella',
		countryLabel: 'Spain',
		href: '/spain/marbella',
		image: `${ASSET_BASE}/loc-marbella.jpg`,
		alt: 'Yachts moored at Puerto Banús below La Concha mountain, Marbella',
		tagline: 'Golf Valley flagship'
	},
	{
		name: 'Estepona',
		countryLabel: 'Spain',
		href: '/spain/estepona',
		image: `${ASSET_BASE}/loc-estepona.jpg`,
		alt: 'Whitewashed old-town façade with flowering balconies in Estepona',
		tagline: 'Growing coastal market'
	},
	{
		name: 'Sotogrande',
		countryLabel: 'Spain',
		href: '/spain/sotogrande',
		image: `${ASSET_BASE}/loc-sotogrande.jpg`,
		alt: 'Hillside residences above the sea at dusk in Sotogrande',
		tagline: 'Polo, Valderrama, exclusive'
	},
	{
		name: 'Algarve',
		countryLabel: 'Portugal',
		href: '/portugal/algarve',
		image: `${ASSET_BASE}/loc-algarve.jpg`,
		alt: 'A boardwalk leading down to a surf beach on the western Algarve coast',
		tagline: '40+ courses, golden coast'
	},
	{
		name: 'Comporta',
		countryLabel: 'Portugal',
		href: '/portugal/comporta',
		image: `${ASSET_BASE}/loc-comporta.jpg`,
		alt: 'A quiet golden-hour cove backed by limestone cliffs on the Portuguese coast',
		tagline: 'Hidden gem, Atlantic dunes'
	},
	{
		name: 'Cascais',
		countryLabel: 'Portugal',
		href: '/portugal/cascais',
		image: `${ASSET_BASE}/loc-cascais.jpg`,
		alt: 'Atlantic surf rolling onto a wide sandy beach near Cascais',
		tagline: 'Lisbon coast lifestyle'
	}
];
