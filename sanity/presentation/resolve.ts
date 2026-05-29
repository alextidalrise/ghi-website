import { getDraftId } from 'sanity';
import {
	defineDocuments,
	type DocumentLocationResolver,
	type PresentationPluginOptions
} from 'sanity/presentation';
import { map } from 'rxjs';
import { buildListingPreviewPath, buildTaxonomyPreviewPath } from '../lib/previewPaths';

const listingLocationQuery = {
	fetch: `*[_id==$id][0]{
		"title": publicTitle,
		"slug": slug.current,
		"countrySlug": location.country->slug.current,
		"locationSlug": location.location->slug.current,
		"communitySlug": location.community->slug.current
	}`,
	listen: `*[_id in [$id, $draftId]]`
} as const;

const taxonomyLocationQuery = {
	fetch: `*[_id==$id][0]{
		name,
		type,
		"slug": slug.current,
		"parentSlug": parent->slug.current,
		"grandparentSlug": parent->parent->slug.current
	}`,
	listen: `*[_id in [$id, $draftId]]`
} as const;

function resolveListingLocation(doc: {
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
			message: 'Complete location (country, location, community) and slug to preview.',
			tone: 'caution' as const
		};
	}

	return {
		locations: [{ title: doc?.title || 'Listing', href }]
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

/** listenQuery resolver — avoids observeForPreview hanging on unsaved drafts. */
export const resolveDocumentLocations: DocumentLocationResolver = (
	params,
	{ documentStore }
) => {
	const queryParams = { id: params.id, draftId: getDraftId(params.id) };
	const listenOptions = { perspective: params.perspectiveStack };

	if (params.type === 'locationTaxonomy') {
		return documentStore
			.listenQuery(taxonomyLocationQuery, queryParams, listenOptions)
			.pipe(map(resolveTaxonomyLocationState));
	}

	if (params.type === 'propertyListing' || params.type === 'development') {
		return documentStore
			.listenQuery(listingLocationQuery, queryParams, listenOptions)
			.pipe(map(resolveListingLocation));
	}

	if (params.type === 'siteSettings') {
		return {
			message: 'Homepage settings',
			tone: 'positive' as const,
			locations: [{ title: 'Homepage', href: '/' }]
		};
	}

	return null;
};

export const mainDocuments = defineDocuments([
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
