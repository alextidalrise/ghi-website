import type { PageServerLoad } from './$types';
import { breadcrumbListJsonLd, type BreadcrumbItem } from '$lib/listing/breadcrumbs';
import { loadReviews } from '$lib/reviews';
import { fetchLocationHeroesBySlug } from '$lib/sanity/queries/settings';
import { buildImageSrcset, buildPublicImageUrl } from '$lib/sanity/image';

const BASE_PATH = '/about';

// 3:2 landscape crop to match the destinations strip tiles.
const DESTINATION_IMAGE = { width: 900, height: 600, fit: 'crop' as const, quality: 82 };
const DESTINATION_WIDTHS = [600, 900, 1200];

// Destinations strip — the places named in the copy. Editorial labels (name/region/alt)
// live here; the imagery now comes from each location's Sanity heroImage (auto AVIF/WebP
// + responsive srcset) instead of raw static JPEGs, keyed by location slug.
const DESTINATIONS = [
	{
		slug: 'marbella',
		name: 'Marbella',
		region: 'Costa del Sol, Spain',
		alt: 'Golf fairways running down to the Mediterranean above Marbella on the Costa del Sol'
	},
	{
		slug: 'sotogrande',
		name: 'Sotogrande',
		region: 'Cádiz, Spain',
		alt: 'Manicured championship course and low villas in the resort of Sotogrande'
	},
	{
		slug: 'algarve',
		name: 'The Algarve',
		region: 'Southern Portugal',
		alt: 'Pine-lined Algarve golf course above the Atlantic coastline in southern Portugal'
	}
];

export const load: PageServerLoad = async ({ url, fetch }) => {
	const canonicalUrl = `${url.origin}${BASE_PATH}`;

	const breadcrumbs: BreadcrumbItem[] = [
		{ label: 'Home', href: '/' },
		{ label: 'About', href: BASE_PATH }
	];

	const [heroes, reviews] = await Promise.all([
		fetchLocationHeroesBySlug(DESTINATIONS.map((d) => d.slug)),
		loadReviews(fetch)
	]);
	const heroBySlug = new Map(heroes.map((h) => [h.slug, h.heroImage]));

	const destinations = DESTINATIONS.map((d) => {
		const asset = heroBySlug.get(d.slug);
		return {
			name: d.name,
			region: d.region,
			alt: d.alt,
			image: buildPublicImageUrl(asset, DESTINATION_IMAGE),
			srcset: buildImageSrcset(asset, DESTINATION_WIDTHS, DESTINATION_IMAGE)
		};
	});

	const seo = {
		title: 'About Us | Golf Homes International',
		description:
			'Specialists in golf property across Spain and Portugal, built around people, not just listings. Meet the team and the trusted network that makes buying abroad simpler and safer.',
		canonicalUrl,
		noindex: false
	};

	return {
		breadcrumbs,
		seo,
		destinations,
		reviews,
		breadcrumbJsonLd: breadcrumbListJsonLd(breadcrumbs, url.origin)
	};
};
