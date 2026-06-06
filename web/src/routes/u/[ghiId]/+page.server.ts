import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { buildCanonicalPath } from '$lib/listing/canonicalPath';
import { fetchPublic, unitByGhiIdQuery } from '$lib/sanity/queries';

const GHI_ID_PATTERN = /^GHI[0-9]{5}$/;

type UnitCanonicalRow = {
	countrySlug?: string | null;
	locationSlug?: string | null;
	communitySlug?: string | null;
	isCatchAll?: boolean | null;
	developmentSlug?: string | null;
	unitSlug?: string | null;
};

/** Resolve a /u/[ghiId] unit permalink to its nested canonical path. */
export const load: PageServerLoad = async ({ params }) => {
	if (!GHI_ID_PATTERN.test(params.ghiId)) {
		error(404, 'Unit not found.');
	}

	const unit = await fetchPublic<UnitCanonicalRow | null>(unitByGhiIdQuery, {
		params: { ghiId: params.ghiId }
	});

	const developmentPath = unit
		? buildCanonicalPath({
				countrySlug: unit.countrySlug,
				locationSlug: unit.locationSlug,
				communitySlug: unit.communitySlug,
				slug: unit.developmentSlug,
				isCatchAll: unit.isCatchAll
			})
		: null;

	if (!developmentPath || !unit?.unitSlug) {
		error(404, 'Unit not found.');
	}

	redirect(301, `${developmentPath}/${unit.unitSlug}`);
};
