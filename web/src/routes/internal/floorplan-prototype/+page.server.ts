import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { propertyByPathQuery } from '$lib/sanity/queries';
import { fetchPublicProperty } from '$lib/sanity/queries/fetch';
import type { MediaAssetInput } from '$lib/sanity/transforms/mediaFilter';
import type { PageServerLoad } from './$types';

export const prerender = false;

/** Same gate as the design-system and map prototypes: dev/preview only. */
function canView(): boolean {
	return env.ENABLE_DESIGN_SYSTEM === 'true' || env.VERCEL_ENV !== 'production';
}

/**
 * The live dev dataset carries no uploaded `media.floorplans[]` yet, so every real
 * property currently shows the Floorplan "No floorplan available" state. This route
 * lets the populated states be reviewed before any Sanity seeding by borrowing a real
 * listing's gallery photos as stand-in plans. The mechanics (preview frame, lightbox,
 * multi-plan paging, empty state) are exactly what ships; only the imagery differs
 * (production floorplans are line drawings on white, which the frame's contain-fit and
 * the lightbox's white matte are built for).
 */
const SAMPLE_PATH = {
	countrySlug: 'spain',
	locationSlug: 'benahavis',
	communitySlug: 'la-quinta',
	slug: 'las-encinas-la-quinta-benahavis'
};

/** Tag a stand-in plan with a floor label so the lightbox caption reads realistically. */
function labelPlan(asset: MediaAssetInput, label: string): MediaAssetInput {
	return { ...asset, altText: label };
}

export const load: PageServerLoad = async ({ setHeaders }) => {
	setHeaders({ 'X-Robots-Tag': 'noindex, nofollow, noarchive' });
	if (!canView()) {
		error(404, 'Not found');
	}

	const property = await fetchPublicProperty(propertyByPathQuery, { params: SAMPLE_PATH });
	const gallery: MediaAssetInput[] = property?.media?.gallery ?? [];

	const multi = [
		gallery[0] ? labelPlan(gallery[0], 'Ground floor') : null,
		gallery[1] ? labelPlan(gallery[1], 'First floor') : null
	].filter((plan): plan is MediaAssetInput => plan != null);

	const single = gallery[0] ? [labelPlan(gallery[0], 'Ground floor')] : [];

	return {
		sampleTitle: property?.title ?? 'Sample property',
		hasSampleImages: gallery.length > 0,
		plans: { multi, single }
	};
};
