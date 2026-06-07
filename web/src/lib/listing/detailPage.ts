import { error, redirect } from '@sveltejs/kit';
import {
	buildDevelopmentBreadcrumbs,
	buildPropertyBreadcrumbs,
	buildUnitBreadcrumbs,
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
import type {
	PublicDevelopment,
	PublicPropertyListing,
	UnitCanonicalContext
} from '$lib/sanity/transforms';
import type { SimilarListingCard } from '$lib/sanity/transforms/similarListingCard';

export type ListingPathParams = {
	countrySlug: string;
	locationSlug: string;
	/** Omitted for catch-all listings served at /{country}/{location}/{slug}. */
	communitySlug?: string;
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
	similarCards: SimilarListingCard[];
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
	const isCatchAll = property.location?.community?.isCatchAll === true;
	const canonicalPath = buildCanonicalPath({
		countrySlug: property.location?.country?.slug ?? countrySlug,
		locationSlug: property.location?.location?.slug ?? locationSlug,
		communitySlug: property.location?.community?.slug ?? communitySlug,
		slug: property.slug ?? slug,
		isCatchAll
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
			slug: property.slug,
			isCatchAll
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
	options: {
		preview?: boolean;
		skipRedirect?: boolean;
		similarCards?: SimilarListingCard[];
	} = {}
): DevelopmentDetailPageData {
	const { countrySlug, locationSlug, communitySlug, slug } = params;
	const isCatchAll = development.location?.community?.isCatchAll === true;
	const canonicalPath = buildCanonicalPath({
		countrySlug: development.location?.country?.slug ?? countrySlug,
		locationSlug: development.location?.location?.slug ?? locationSlug,
		communitySlug: development.location?.community?.slug ?? communitySlug,
		slug: development.slug ?? slug,
		isCatchAll
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
			slug: development.slug,
			isCatchAll
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
		similarCards: options.similarCards ?? []
	};
}

export type UnitPathParams = {
	countrySlug: string;
	locationSlug: string;
	/** Omitted when the parent development is catch-all (served without a community segment). */
	communitySlug?: string;
	developmentSlug: string;
	unitSlug: string;
};

/** Build the nested canonical unit path: the development's path + the unit slug. */
function buildUnitCanonicalPath(context: UnitCanonicalContext): string | null {
	const developmentPath = buildCanonicalPath({
		countrySlug: context.countrySlug,
		locationSlug: context.locationSlug,
		communitySlug: context.communitySlug,
		slug: context.developmentSlug,
		isCatchAll: context.isCatchAll
	});
	if (!developmentPath || !context.unitSlug) {
		return null;
	}
	return `${developmentPath}/${context.unitSlug}`;
}

function requestedUnitPath(params: UnitPathParams): string {
	const segments = [params.countrySlug, params.locationSlug];
	if (params.communitySlug) segments.push(params.communitySlug);
	segments.push(params.developmentSlug, params.unitSlug);
	return `/${segments.join('/')}`;
}

export function buildUnitDetailPageData(
	listing: PublicPropertyListing,
	context: UnitCanonicalContext,
	siteOrigin: string,
	params: UnitPathParams,
	options: {
		preview?: boolean;
		skipRedirect?: boolean;
		similarCards?: PropertyDetailPageData['similarCards'];
	} = {}
): PropertyDetailPageData {
	const developmentPath = buildCanonicalPath({
		countrySlug: context.countrySlug,
		locationSlug: context.locationSlug,
		communitySlug: context.communitySlug,
		slug: context.developmentSlug,
		isCatchAll: context.isCatchAll
	});
	const canonicalPath = buildUnitCanonicalPath(context);

	if (!developmentPath || !canonicalPath || !listing._id) {
		error(404, 'Unit not found.');
	}

	if (!options.skipRedirect && requestedUnitPath(params) !== canonicalPath) {
		redirect(301, canonicalPath);
	}

	const canonicalUrl = `${siteOrigin}${canonicalPath}`;
	const breadcrumbs = buildUnitBreadcrumbs(
		listing,
		context.developmentTitle,
		developmentPath,
		canonicalPath
	);
	const seo = options.preview
		? applyPreviewSeo(buildPropertySeo(listing, canonicalUrl))
		: buildPropertySeo(listing, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, siteOrigin);
	const listingJsonLd =
		options.preview || seo.noindex ? null : buildRealEstateListingJsonLd(listing, canonicalUrl);

	return {
		pageType: 'property',
		property: listing,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd,
		listingJsonLd,
		similarCards: options.similarCards ?? []
	};
}

export function withPreviewLocationSeo<T extends PropertySeoMeta & { canonicalUrl: string }>(
	seo: T
): T {
	return { ...seo, noindex: true };
}
