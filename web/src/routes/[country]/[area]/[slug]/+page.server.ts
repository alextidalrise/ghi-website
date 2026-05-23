import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	developmentByPathQuery,
	developmentStalePathQuery,
	fetchPublic,
	fetchPublicDevelopment,
	fetchPublicProperty,
	propertyByPathQuery,
	propertyStalePathQuery
} from '$lib/sanity/queries';
import {
	buildDevelopmentBreadcrumbs,
	buildPropertyBreadcrumbs,
	breadcrumbListJsonLd
} from '$lib/listing/breadcrumbs';
import { buildCanonicalPath, pathsMatch } from '$lib/listing/canonicalPath';
import { buildDevelopmentSeo, buildPropertySeo } from '$lib/listing/seo';
import type { PublicDevelopment, PublicPropertyListing } from '$lib/sanity/transforms';

type StalePathRow = {
	countrySlug?: string | null;
	areaSlug?: string | null;
	slug?: string | null;
};

export const load: PageServerLoad = async ({ params, url }) => {
	const countrySlug = params.country;
	const areaSlug = params.area;
	const slug = params.slug;

	const property = await fetchPublicProperty(propertyByPathQuery, {
		params: { countrySlug, areaSlug, slug }
	});

	if (property) {
		return buildPropertyPagePayload(property, url.origin, countrySlug, areaSlug, slug);
	}

	const stalePropertyMatches = await fetchPublic<StalePathRow[]>(propertyStalePathQuery, {
		params: { countrySlug, slug }
	});

	if (stalePropertyMatches?.length === 1) {
		const canonical = stalePropertyMatches[0];
		if (
			!pathsMatch({ countrySlug, areaSlug, slug }, canonical) &&
			buildCanonicalPath(canonical)
		) {
			redirect(301, buildCanonicalPath(canonical)!);
		}
	}

	const development = await fetchPublicDevelopment(developmentByPathQuery, {
		params: { countrySlug, areaSlug, slug }
	});

	if (development) {
		return buildDevelopmentPagePayload(development, url.origin, countrySlug, areaSlug, slug);
	}

	const staleDevelopmentMatches = await fetchPublic<StalePathRow[]>(developmentStalePathQuery, {
		params: { countrySlug, slug }
	});

	if (staleDevelopmentMatches?.length === 1) {
		const canonical = staleDevelopmentMatches[0];
		if (
			!pathsMatch({ countrySlug, areaSlug, slug }, canonical) &&
			buildCanonicalPath(canonical)
		) {
			redirect(301, buildCanonicalPath(canonical)!);
		}
	}

	error(404, 'Listing not found.');
};

function buildPropertyPagePayload(
	property: PublicPropertyListing,
	siteOrigin: string,
	countrySlug: string,
	areaSlug: string,
	slug: string
) {
	const canonicalPath = buildCanonicalPath({
		countrySlug: property.location?.country?.slug ?? countrySlug,
		areaSlug: property.location?.area?.slug ?? areaSlug,
		slug: property.slug ?? slug
	});

	if (!canonicalPath) {
		error(404, 'Property not found.');
	}

	if (
		!pathsMatch({ countrySlug, areaSlug, slug }, {
			countrySlug: property.location?.country?.slug,
			areaSlug: property.location?.area?.slug,
			slug: property.slug
		})
	) {
		redirect(301, canonicalPath);
	}

	const canonicalUrl = `${siteOrigin}${canonicalPath}`;
	const breadcrumbs = buildPropertyBreadcrumbs(property, canonicalPath);
	const seo = buildPropertySeo(property, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, siteOrigin);

	return {
		pageType: 'property' as const,
		property,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
}

function buildDevelopmentPagePayload(
	development: PublicDevelopment,
	siteOrigin: string,
	countrySlug: string,
	areaSlug: string,
	slug: string
) {
	const canonicalPath = buildCanonicalPath({
		countrySlug: development.location?.country?.slug ?? countrySlug,
		areaSlug: development.location?.area?.slug ?? areaSlug,
		slug: development.slug ?? slug
	});

	if (!canonicalPath) {
		error(404, 'Development not found.');
	}

	if (
		!pathsMatch({ countrySlug, areaSlug, slug }, {
			countrySlug: development.location?.country?.slug,
			areaSlug: development.location?.area?.slug,
			slug: development.slug
		})
	) {
		redirect(301, canonicalPath);
	}

	const canonicalUrl = `${siteOrigin}${canonicalPath}`;
	const breadcrumbs = buildDevelopmentBreadcrumbs(development, canonicalPath);
	const seo = buildDevelopmentSeo(development, canonicalUrl);
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, siteOrigin);

	return {
		pageType: 'development' as const,
		development,
		canonicalUrl,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
}
