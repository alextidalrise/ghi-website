import { buildPublicImageUrl } from '$lib/sanity/image';
import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';
import type { PublicPricing } from '$lib/sanity/transforms/pricingFilter';

/** SEO payload built only from allowlisted seo fields on the public listing. */
export type PropertySeoMeta = {
	title: string;
	description: string | null;
	openGraphTitle: string | null;
	openGraphDescription: string | null;
	openGraphImageUrl: string | null;
	noindex: boolean;
	schemaType: string | null;
};

export function buildPropertySeo(
	listing: PublicPropertyListing,
	canonicalUrl: string
): PropertySeoMeta & { canonicalUrl: string } {
	const seo = listing.seo;
	const fallbackTitle = listing.publicTitle ?? 'Property';
	const fallbackDescription = listing.content?.shortDescription ?? null;

	return {
		canonicalUrl,
		title: seo?.seoTitle ?? fallbackTitle,
		description: seo?.metaDescription ?? fallbackDescription,
		openGraphTitle: seo?.openGraphTitle ?? seo?.seoTitle ?? fallbackTitle,
		openGraphDescription: seo?.openGraphDescription ?? seo?.metaDescription ?? fallbackDescription,
		openGraphImageUrl: buildPublicImageUrl(seo?.openGraphImage ?? listing.media?.heroImage, {
			width: 1200,
			height: 630,
			fit: 'crop'
		}),
		noindex: seo?.noindex ?? false,
		schemaType: seo?.schemaType ?? 'RealEstateListing'
	};
}

type LocationSeoFields = {
	name: string;
	seoTitle?: string | null;
	metaDescription?: string | null;
	publicDescription?: string | null;
};

export function buildLocationSeo(
	location: LocationSeoFields,
	canonicalUrl: string
): PropertySeoMeta & { canonicalUrl: string } {
	const fallbackDescription = location.publicDescription ?? null;

	return {
		canonicalUrl,
		title: location.seoTitle ?? location.name,
		description: location.metaDescription ?? fallbackDescription,
		openGraphTitle: location.seoTitle ?? location.name,
		openGraphDescription: location.metaDescription ?? fallbackDescription,
		openGraphImageUrl: null,
		noindex: false,
		schemaType: null
	};
}

type ListingLocation = NonNullable<PublicPropertyListing['location']>;

function buildPostalAddress(location: ListingLocation | null): Record<string, unknown> | undefined {
	if (!location) {
		return undefined;
	}

	const locality =
		location.community?.name ?? location.location?.name ?? location.country?.name ?? undefined;
	const streetAddress = location.addressDisplay ?? location.microLocation ?? undefined;

	if (!streetAddress && !locality) {
		return undefined;
	}

	return {
		'@type': 'PostalAddress',
		...(streetAddress ? { streetAddress } : {}),
		...(locality ? { addressLocality: locality } : {}),
		...(location.country?.name ? { addressCountry: location.country.name } : {})
	};
}

function buildGeoCoordinates(
	location: ListingLocation | null
): Record<string, unknown> | undefined {
	const map = location?.map;
	if (map?.level !== 'exact' || !map.coordinates) {
		return undefined;
	}

	return {
		'@type': 'GeoCoordinates',
		latitude: map.coordinates.lat,
		longitude: map.coordinates.lng
	};
}

function buildOffers(pricing: PublicPricing | null | undefined): Record<string, unknown> | undefined {
	if (!pricing) {
		return undefined;
	}

	const price = pricing.price ?? pricing.priceFrom;
	if (price == null) {
		return undefined;
	}

	const currency = pricing.currency ?? 'EUR';
	const availability =
		pricing.availabilityStatus === 'sold'
			? 'https://schema.org/SoldOut'
			: 'https://schema.org/InStock';

	return {
		'@type': 'Offer',
		price,
		priceCurrency: currency,
		availability
	};
}

function buildFloorSize(specs: Record<string, unknown> | null | undefined): Record<string, unknown> | undefined {
	const builtArea = specs?.builtArea;
	if (typeof builtArea !== 'number') {
		return undefined;
	}

	const unitCode = specs?.builtAreaUnit === 'sqft' ? 'FTK' : 'MTK';

	return {
		'@type': 'QuantitativeValue',
		value: builtArea,
		unitCode
	};
}

function buildListingImage(listing: PublicPropertyListing): string | null {
	return buildPublicImageUrl(listing.seo?.openGraphImage ?? listing.media?.heroImage, {
		width: 1200,
		height: 630,
		fit: 'crop'
	});
}

/** Build RealEstateListing JSON-LD from a post-transform public property payload. */
export function buildRealEstateListingJsonLd(
	listing: PublicPropertyListing,
	canonicalUrl: string
): Record<string, unknown> {
	const seo = listing.seo;
	const specs = listing.specs;
	const bedrooms = typeof specs?.bedrooms === 'number' ? specs.bedrooms : undefined;
	const address = buildPostalAddress(listing.location);
	const geo = buildGeoCoordinates(listing.location);
	const offers = buildOffers(listing.pricing);
	const floorSize = buildFloorSize(specs);
	const image = buildListingImage(listing);

	const jsonLd: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': seo?.schemaType ?? 'RealEstateListing',
		name: listing.publicTitle ?? 'Property',
		url: canonicalUrl
	};

	const description = seo?.metaDescription ?? listing.content?.shortDescription;
	if (description) {
		jsonLd.description = description;
	}

	if (image) {
		jsonLd.image = image;
	}

	if (address) {
		jsonLd.address = address;
	}

	if (geo) {
		jsonLd.geo = geo;
	}

	if (offers) {
		jsonLd.offers = offers;
	}

	if (bedrooms != null) {
		jsonLd.numberOfRooms = bedrooms;
	}

	if (floorSize) {
		jsonLd.floorSize = floorSize;
	}

	return jsonLd;
}

export function buildDevelopmentSeo(
	development: PublicDevelopment,
	canonicalUrl: string
): PropertySeoMeta & { canonicalUrl: string } {
	const seo = development.seo;
	const fallbackTitle = development.publicTitle ?? development.developmentName ?? 'Development';
	const fallbackDescription = development.content?.shortDescription ?? null;

	return {
		canonicalUrl,
		title: seo?.seoTitle ?? fallbackTitle,
		description: seo?.metaDescription ?? fallbackDescription,
		openGraphTitle: seo?.openGraphTitle ?? seo?.seoTitle ?? fallbackTitle,
		openGraphDescription: seo?.openGraphDescription ?? seo?.metaDescription ?? fallbackDescription,
		openGraphImageUrl: buildPublicImageUrl(seo?.openGraphImage ?? development.media?.heroImage, {
			width: 1200,
			height: 630,
			fit: 'crop'
		}),
		noindex: seo?.noindex ?? false,
		schemaType: seo?.schemaType ?? 'RealEstateListing'
	};
}
