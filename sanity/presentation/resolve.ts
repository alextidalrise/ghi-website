import { getDraftId } from 'sanity';
import {
	defineDocuments,
	type DocumentLocationResolver,
	type PresentationPluginOptions
} from 'sanity/presentation';
import { map } from 'rxjs';
import {
	LISTING_COMMUNITY_SLUG,
	LISTING_COUNTRY_SLUG,
	LISTING_LOCATION_SLUG
} from '../lib/listingLocationSlugs';
import {
	buildGolfCoursePreviewPath,
	buildListingPreviewPath,
	buildTaxonomyPreviewPath
} from '../lib/previewPaths';

const LISTING_LOCATION_QUERY = {
	fetch: `*[_id==$id][0]{
		title,
		"slug": slug.current,
		"countrySlug": ${LISTING_COUNTRY_SLUG},
		"locationSlug": ${LISTING_LOCATION_SLUG},
		"communitySlug": ${LISTING_COMMUNITY_SLUG}
	}`,
	listen: `*[_id in [$id, $draftId]]`
} as const;

const GOLF_COURSE_LOCATION_QUERY = {
	fetch: `*[_id==$id][0]{
		name,
		"slug": slug.current,
		"communitySlug": community->slug.current,
		"locationSlug": community->parent->slug.current,
		"countrySlug": community->parent->parent->slug.current
	}`,
	listen: `*[_id in [$id, $draftId]]`
} as const;

const TAXONOMY_LOCATION_QUERY = {
	fetch: `*[_id==$id][0]{
		name,
		type,
		"slug": slug.current,
		"parentSlug": parent->slug.current,
		"grandparentSlug": parent->parent->slug.current
	}`,
	listen: `*[_id in [$id, $draftId]]`
} as const;

export function resolveListingLocation(doc: {
	title?: string | null;
	slug?: string | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
} | null) {
	const href = buildListingPreviewPath({
		countrySlug: doc?.countrySlug,
		locationSlug: doc?.locationSlug,
		communitySlug: doc?.communitySlug,
		slug: doc?.slug
	});

	if (!href) {
		return {
			message: 'Select a community and add a slug to preview.',
			tone: 'caution' as const
		};
	}

	return {
		locations: [{ title: doc?.title || 'Listing', href }]
	};
}

export function resolveGolfCourseLocationState(doc: {
	name?: string | null;
	slug?: string | null;
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
} | null) {
	const href = buildGolfCoursePreviewPath({
		countrySlug: doc?.countrySlug,
		locationSlug: doc?.locationSlug,
		communitySlug: doc?.communitySlug,
		slug: doc?.slug
	});

	if (!href) {
		return {
			message: 'Select a community and add a slug to preview this golf course page.',
			tone: 'caution' as const
		};
	}

	return {
		locations: [{ title: doc?.name || 'Golf course', href }]
	};
}

export function resolveTaxonomyLocationState(doc: {
	name?: string | null;
	type?: string | null;
	slug?: string | null;
	parentSlug?: string | null;
	grandparentSlug?: string | null;
} | null) {
	const href = buildTaxonomyPreviewPath({
		type: doc?.type,
		slug: doc?.slug,
		parentSlug: doc?.parentSlug,
		grandparentSlug: doc?.grandparentSlug
	});

	if (!href) {
		return {
			message: 'Complete slug and parent hierarchy to preview this location page.',
			tone: 'caution' as const
		};
	}

	return {
		locations: [{ title: doc?.name || 'Location', href }]
	};
}

export const resolveDocumentLocations: DocumentLocationResolver = (params, context) => {
	if (params.type === 'siteSettings') {
		return {
			message: 'Homepage settings',
			tone: 'positive',
			locations: [{ title: 'Homepage', href: '/' }]
		};
	}

	const queryParams = { id: params.id, draftId: getDraftId(params.id) };
	const listenOptions = { perspective: params.perspectiveStack };

	if (params.type === 'propertyListing' || params.type === 'development') {
		return context.documentStore
			.listenQuery(LISTING_LOCATION_QUERY, queryParams, listenOptions)
			.pipe(map((doc) => resolveListingLocation(doc)));
	}

	if (params.type === 'locationTaxonomy') {
		return context.documentStore
			.listenQuery(TAXONOMY_LOCATION_QUERY, queryParams, listenOptions)
			.pipe(map((doc) => resolveTaxonomyLocationState(doc)));
	}

	if (params.type === 'golfCourse') {
		return context.documentStore
			.listenQuery(GOLF_COURSE_LOCATION_QUERY, queryParams, listenOptions)
			.pipe(map((doc) => resolveGolfCourseLocationState(doc)));
	}

	return null;
};

export const mainDocuments = defineDocuments([
	{
		route: '/:country/:location/:community/golf/:slug',
		filter: `_type == "golfCourse" && slug.current == $slug`
	},
	{
		route: '/:country/:location/:community/:slug',
		filter: `_type in ["propertyListing", "development"] && slug.current == $slug`
	},
	{
		route: '/:country/:location/:community',
		filter: `_type == "locationTaxonomy" && type == "community" && slug.current == $community`
	},
	{
		route: '/:country/:location',
		filter: `_type == "locationTaxonomy" && type == "location" && slug.current == $location`
	},
	{
		route: '/:country',
		filter: `_type == "locationTaxonomy" && type == "country" && slug.current == $country`
	}
]);

export const resolve: PresentationPluginOptions['resolve'] = {
	mainDocuments,
	locations: resolveDocumentLocations
};
