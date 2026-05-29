import { error, redirect } from '@sveltejs/kit';
import {
	buildDevelopmentBreadcrumbs,
	buildPropertyBreadcrumbs,
	breadcrumbListJsonLd,
	type BreadcrumbItem
} from '$lib/listing/breadcrumbs';
import { buildCanonicalPath, pathsMatch } from '$lib/listing/canonicalPath';
import {
	buildDevelopmentSeo,
	buildPropertySeo,
	buildRealEstateListingJsonLd,
	type PropertySeoMeta
} from '$lib/listing/seo';
import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';
import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

export type ListingPathParams = {
	countrySlug: string;
	locationSlug: string;
	communitySlug: string;
	slug: string;
};

export type PropertyDetailPageData = {
	pageType: 'property';
	property: PublicPropertyListing;
	canonicalUrl: string;
	breadcrumbs: BreadcrumbItem[];
	seo: PropertySeoMeta & { canonicalUrl: string };
	breadcrumbJsonLd: Record<string, unknown>;
	listingJsonLd: Record<string, unknown> | null;
	similarCards: SimilarListingCard[];
};

export type DevelopmentDetailPageData = {
	pageType: 'development';
	development: PublicDevelopment;
	canonicalUrl: string;
	breadcrumbs: BreadcrumbItem[];
	seo: PropertySeoMeta & { canonicalUrl: string };
	breadcrumbJsonLd: Record<string, unknown>;
	listingJsonLd: null;
	similarCards: [];
};

function applyPreviewSeo(seo: PropertySeoMeta & { canonicalUrl: string }) {
	return { ...seo, noindex: true };
}

export function buildPropertyDetailPageData(
	property: PublicPropertyListing,
	siteOrigin: string,
	params: ListingPathParams,
	options: {
		preview?: boolean;
		skipRedirect?: boolean;
		similarCards?: PropertyDetailPageData['similarCards'];
	} = {}
): PropertyDetailPageData {
	const { countrySlug, locationSlug, communitySlug, slug } = params;
	const canonicalPath = buildCanonicalPath({
		countrySlug: property.location?.country?.slug ?? countrySlug,
		locationSlug: property.location?.location?.slug ?? locationSlug,
		communitySlug: property.location?.community?.slug ?? communitySlug,
		slug: property.slug ?? slug
	});

	if (!canonicalPath) {
		error(404, 'Property not found.');
	}

	if (
		!options.skipRedirect &&
		!pathsMatch({ countrySlug, locationSlug, communitySlug, slug }, {
			countrySlug: property.location?.country?.slug,
			locationSlug: property.location?.location?.slug,
			communitySlug: property.location?.community?.slug,
			slug: property.slug
		})
	) {
		redirect(301, canonicalPath);
	}

	const canonicalUrl = `${siteOrigin}${canonicalPath}`;
	const breadcrumbs = buildPropertyBreadcrumbs(property, canonicalPath);
	const seo = options.preview
		? applyPreviewSeo(buildPropertySeo(property, canonicalUrl))
		: buildPropertySeo(property, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, siteOrigin);
	const listingJsonLd =
		options.preview || seo.noindex
			? null
			: buildRealEstateListingJsonLd(property, canonicalUrl);

	if (!property._id) {
		error(404, 'Property not found.');
	}

	return {
		pageType: 'property',
		property,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		listingJsonLd,
		similarCards: options.similarCards ?? []
	};
}

export function buildDevelopmentDetailPageData(
	development: PublicDevelopment,
	siteOrigin: string,
	params: ListingPathParams,
	options: { preview?: boolean; skipRedirect?: boolean } = {}
): DevelopmentDetailPageData {
	const { countrySlug, locationSlug, communitySlug, slug } = params;
	const canonicalPath = buildCanonicalPath({
		countrySlug: development.location?.country?.slug ?? countrySlug,
		locationSlug: development.location?.location?.slug ?? locationSlug,
		communitySlug: development.location?.community?.slug ?? communitySlug,
		slug: development.slug ?? slug
	});

	if (!canonicalPath) {
		error(404, 'Development not found.');
	}

	if (
		!options.skipRedirect &&
		!pathsMatch({ countrySlug, locationSlug, communitySlug, slug }, {
			countrySlug: development.location?.country?.slug,
			locationSlug: development.location?.location?.slug,
			communitySlug: development.location?.community?.slug,
			slug: development.slug
		})
	) {
		redirect(301, canonicalPath);
	}

	const canonicalUrl = `${siteOrigin}${canonicalPath}`;
	const breadcrumbs = buildDevelopmentBreadcrumbs(development, canonicalPath);
	const seo = options.preview
		? applyPreviewSeo(buildDevelopmentSeo(development, canonicalUrl))
		: buildDevelopmentSeo(development, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, siteOrigin);

	return {
		pageType: 'development',
		development,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		listingJsonLd: null,
		similarCards: []
	};
}

export function withPreviewLocationSeo<T extends PropertySeoMeta & { canonicalUrl: string }>(
	seo: T
): T {
	return { ...seo, noindex: true };
}
