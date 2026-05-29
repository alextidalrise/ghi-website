import {
	defineDocuments,
	defineLocations,
	type PresentationPluginOptions
} from 'sanity/presentation';
import { buildListingPreviewPath, buildTaxonomyPreviewPath } from '../lib/previewPaths';

const listingSelect = {
	title: 'publicTitle',
	slug: 'slug.current',
	countrySlug: 'location.country.slug.current',
	locationSlug: 'location.location.slug.current',
	communitySlug: 'location.community.slug.current'
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

const locations: NonNullable<PresentationPluginOptions['resolve']>['locations'] = {
	propertyListing: defineLocations({
		select: listingSelect,
		resolve: resolveListingLocation
	}),
	development: defineLocations({
		select: listingSelect,
		resolve: resolveListingLocation
	}),
	locationTaxonomy: defineLocations({
		select: {
			name: 'name',
			type: 'type',
			slug: 'slug.current',
			parentSlug: 'parent.slug.current',
			grandparentSlug: 'parent.parent.slug.current'
		},
		resolve: resolveTaxonomyLocationState
	}),
	siteSettings: defineLocations({
		message: 'Homepage settings',
		tone: 'positive',
		locations: [{ title: 'Homepage', href: '/' }]
	})
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
	locations
};
