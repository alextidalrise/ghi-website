import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildGolfCourseBreadcrumbs, breadcrumbListJsonLd } from '$lib/listing/breadcrumbs';
import { withPreviewLocationSeo } from '$lib/listing/detailPage';
import { buildGolfCourseSeo } from '$lib/listing/seo';
import { hasIndexAffectingQuery } from '$lib/seo/indexability';
import { parseListingSearchParams } from '$lib/listing/searchParams';
import {
	fetchListingCards,
	fetchMaybePreview,
	golfCourseByPathQuery
} from '$lib/sanity/queries';
import {
	resolveGolfCourseHero,
	toPublicGolfCourse,
	type RawGolfCourse
} from '$lib/sanity/transforms';

export const load: PageServerLoad = async ({ params, url, locals: { preview, loadQuery } }) => {
	const raw = await fetchMaybePreview<RawGolfCourse | null>(
		golfCourseByPathQuery,
		{
			countrySlug: params.country,
			locationSlug: params.location,
			communitySlug: params.community,
			slug: params.slug
		},
		loadQuery,
		preview
	);

	const course = toPublicGolfCourse(raw);
	if (!course) {
		error(404, 'Golf course not found.');
	}

	const canonicalPath = `/${params.country}/${params.location}/${params.community}/golf/${params.slug}`;
	const canonicalUrl = `${url.origin}${canonicalPath}`;
	const searchParams = parseListingSearchParams(url);

	const listingResults = await fetchListingCards({
		scope: { type: 'golfCourse', golfCourseId: course._id },
		params: searchParams
	});

	const breadcrumbs = buildGolfCourseBreadcrumbs(course, canonicalPath);
	const seoBase = buildGolfCourseSeo(course, canonicalUrl);
	if (hasIndexAffectingQuery(searchParams)) {
		seoBase.noindex = true;
	}
	const seo = preview ? withPreviewLocationSeo(seoBase) : seoBase;
	const breadcrumbJsonLd = breadcrumbListJsonLd(breadcrumbs, url.origin);

	return {
		pageType: 'golfCourse' as const,
		course,
		courseHero: resolveGolfCourseHero(raw),
		canonicalPath,
		searchParams,
		listingResults,
		breadcrumbs,
		seo,
		breadcrumbJsonLd
	};
};
