import { describe, expect, it } from 'vitest';
import type { PublicPropertyListing } from '$lib/sanity/transforms';
import type { UnitCanonicalContext } from '$lib/sanity/transforms';
import { buildUnitDetailPageData } from './detailPage';

const ORIGIN = 'https://www.golfhomesinternational.com';

/* Minimal listing: buildUnitDetailPageData only reads _id, title, media and seo off it. The
   cast keeps the fixture to the fields under test rather than restating the whole document. */
function unitListing(overrides: Partial<PublicPropertyListing> = {}): PublicPropertyListing {
	return {
		_id: 'ghi00160-natura-village-unit-9-a',
		title: '9-A',
		media: null,
		seo: null,
		...overrides
	} as unknown as PublicPropertyListing;
}

const standardContext: UnitCanonicalContext = {
	countrySlug: 'spain',
	locationSlug: 'marbella',
	communitySlug: 'nueva-andalucia',
	isCatchAll: false,
	developmentSlug: 'la-quinta-residences',
	unitSlug: 'apartment-3b',
	developmentTitle: 'La Quinta Residences'
};

const standardParams = {
	countrySlug: 'spain',
	locationSlug: 'marbella',
	communitySlug: 'nueva-andalucia',
	developmentSlug: 'la-quinta-residences',
	unitSlug: 'apartment-3b'
};

describe('buildUnitDetailPageData canonical', () => {
	/* Sibling units are ~97% identical — same hero image, same development-level meta
	   description, differing only in unit code, price, beds and floor area. Google read that
	   pattern and parked them under "Discovered - currently not indexed". rel=canonical now
	   points at the parent development so the signals consolidate there. */
	it('points the SEO canonical at the parent development, not the unit', () => {
		const data = buildUnitDetailPageData(unitListing(), standardContext, ORIGIN, standardParams);

		expect(data.seo.canonicalUrl).toBe(
			`${ORIGIN}/spain/marbella/nueva-andalucia/la-quinta-residences`
		);
	});

	/* The unit keeps its OWN url as the page identity. That url is the 301 normalisation
	   target and the {#key} the page remounts on — and the page must keep serving 200 there,
	   because a redirected or blocked url is one Google can never read the canonical from. */
	it('keeps the unit path as the page canonicalUrl so it still serves at its own url', () => {
		const data = buildUnitDetailPageData(unitListing(), standardContext, ORIGIN, standardParams);

		expect(data.canonicalUrl).toBe(
			`${ORIGIN}/spain/marbella/nueva-andalucia/la-quinta-residences/apartment-3b`
		);
		expect(data.seo.canonicalUrl).not.toBe(data.canonicalUrl);
	});

	/* A catch-all development drops the community segment. The canonical must follow that same
	   3-segment rule, or it would point at a url that itself 301s — the exact defect PR #126
	   fixed in the sitemap. */
	it('drops the community segment for a catch-all development', () => {
		const data = buildUnitDetailPageData(
			unitListing(),
			{
				countrySlug: 'portugal',
				locationSlug: 'vilamoura',
				communitySlug: 'vilamoura',
				isCatchAll: true,
				developmentSlug: 'natura-village',
				unitSlug: 'natura-village-9-unit-a-vilamoura',
				developmentTitle: 'Natura Village'
			},
			ORIGIN,
			{
				countrySlug: 'portugal',
				locationSlug: 'vilamoura',
				developmentSlug: 'natura-village',
				unitSlug: 'natura-village-9-unit-a-vilamoura'
			}
		);

		expect(data.seo.canonicalUrl).toBe(`${ORIGIN}/portugal/vilamoura/natura-village`);
	});

	/* A per-unit RealEstateListing carrying the unit's own url would contradict the canonical
	   now pointing at the development — two answers to "which url is this page?". */
	it('emits no per-unit listing JSON-LD', () => {
		const data = buildUnitDetailPageData(unitListing(), standardContext, ORIGIN, standardParams);

		expect(data.listingJsonLd).toBeNull();
	});

	/* Breadcrumbs are navigation, not canonicalisation: they must still lead to the unit's own
	   url so the trail matches the page the visitor is on. */
	it('keeps breadcrumbs pointing at the unit itself', () => {
		const data = buildUnitDetailPageData(unitListing(), standardContext, ORIGIN, standardParams);

		expect(data.breadcrumbs.at(-1)?.href).toBe(
			'/spain/marbella/nueva-andalucia/la-quinta-residences/apartment-3b'
		);
	});
});
