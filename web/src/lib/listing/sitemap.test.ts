import { describe, expect, it } from 'vitest';
import {
	buildGolfCoursePath,
	buildListingPath,
	buildTaxonomyPath,
	buildUnitPath,
	collectSitemapEntries,
	renderSitemapXml
} from './sitemap';
import { sitemapListingsQuery, sitemapUnitsQuery } from '$lib/sanity/queries';

describe('buildTaxonomyPath', () => {
	it('builds country and location paths; community taxonomy is not indexed', () => {
		expect(buildTaxonomyPath({ type: 'country', countrySlug: 'spain' })).toBe('/spain');
		expect(
			buildTaxonomyPath({
				type: 'location',
				parentType: 'country',
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol'
			})
		).toBe('/spain/costa-del-sol');
		expect(
			buildTaxonomyPath({
				type: 'community',
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella'
			})
		).toBeNull();
	});

	it('drops location nodes whose parent is a location, not a country', () => {
		// Mistyped community nodes (e.g. the Estepona catch-all, or el-campanario) carry
		// type:"location" but hang off the Estepona location, so `countrySlug` resolves to
		// `estepona`. Emitting them produced /estepona/estepona and /estepona/el-campanario,
		// both 404s. Gating on parent:"country" keeps them out of the sitemap.
		expect(
			buildTaxonomyPath({
				type: 'location',
				parentType: 'location',
				countrySlug: 'estepona',
				locationSlug: 'estepona'
			})
		).toBeNull();
		expect(
			buildTaxonomyPath({
				type: 'location',
				parentType: 'location',
				countrySlug: 'estepona',
				locationSlug: 'el-campanario'
			})
		).toBeNull();
	});
});

describe('collectSitemapEntries', () => {
	it('deduplicates paths and includes homepage plus listing canonical paths', () => {
		const entries = collectSitemapEntries(
			[
				{ type: 'country', countrySlug: 'spain', _updatedAt: '2026-05-01T00:00:00.000Z' },
				{
					type: 'location',
					parentType: 'country',
					countrySlug: 'spain',
					locationSlug: 'costa-del-sol',
					_updatedAt: '2026-05-02T00:00:00.000Z'
				}
			],
			[
				{
					countrySlug: 'spain',
					locationSlug: 'costa-del-sol',
					communitySlug: 'marbella',
					slug: 'villa-example',
					_updatedAt: '2026-05-03T00:00:00.000Z'
				},
				{
					countrySlug: 'spain',
					locationSlug: 'costa-del-sol',
					communitySlug: 'marbella',
					slug: 'villa-example',
					_updatedAt: '2026-05-04T00:00:00.000Z'
				}
			]
		);

		const paths = entries.map((entry) => entry.path);
		expect(paths).toContain('/');
		expect(paths).toContain('/spain');
		expect(paths).toContain('/spain/costa-del-sol');
		expect(paths).toContain('/spain/costa-del-sol/marbella/villa-example');

		const listing = entries.find((entry) => entry.path.endsWith('/villa-example'));
		expect(listing?.lastmod).toBe('2026-05-04T00:00:00.000Z');
	});
});

describe('renderSitemapXml', () => {
	it('returns well-formed XML with escaped URLs', () => {
		const xml = renderSitemapXml('https://example.com', [
			{ path: '/', lastmod: '2026-05-01T00:00:00.000Z' },
			{ path: '/spain/costa-del-sol/marbella/villa-example' }
		]);

		expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
		expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(xml).toContain('<loc>https://example.com/</loc>');
		expect(xml).toContain(
			'<loc>https://example.com/spain/costa-del-sol/marbella/villa-example</loc>'
		);
		expect(xml).toContain('<lastmod>2026-05-01T00:00:00.000Z</lastmod>');
	});
});

describe('buildGolfCoursePath', () => {
	it('builds a golf course canonical path', () => {
		expect(
			buildGolfCoursePath({
				countrySlug: 'spain',
				locationSlug: 'marbella',
				communitySlug: 'nueva-andalucia',
				slug: 'aloha-golf'
			})
		).toBe('/spain/marbella/nueva-andalucia/golf/aloha-golf');
	});
});

describe('collectSitemapEntries golf courses', () => {
	it('includes approved golf course pages', () => {
		const entries = collectSitemapEntries(
			[],
			[],
			[
				{
					countrySlug: 'spain',
					locationSlug: 'marbella',
					communitySlug: 'nueva-andalucia',
					slug: 'aloha-golf',
					_updatedAt: '2026-06-01T00:00:00.000Z'
				}
			]
		);

		const paths = entries.map((entry) => entry.path);
		expect(paths).toContain('/');
		expect(paths).toContain('/spain/marbella/nueva-andalucia/golf/aloha-golf');
	});
});

describe('collectSitemapEntries static routes', () => {
	it('includes all approved static indexable routes', () => {
		const entries = collectSitemapEntries([], []);
		const paths = entries.map((entry) => entry.path);

		expect(paths).toContain('/about');
		expect(paths).toContain('/contact');
		expect(paths).toContain('/front-line-collection');
		expect(paths).toContain('/partners');
	});

	it('does not include noindex, holding, internal or legal routes', () => {
		const entries = collectSitemapEntries([], []);
		const paths = entries.map((entry) => entry.path);

		expect(paths).not.toContain('/soon');
		expect(paths).not.toContain('/internal');
		expect(paths).not.toContain('/privacy');
		expect(paths).not.toContain('/terms');
		expect(paths).not.toContain('/cookies');
	});

	it('does not include query-string URLs', () => {
		const entries = collectSitemapEntries([], []);
		for (const entry of entries) {
			expect(entry.path).not.toContain('?');
		}
	});
});

describe('buildListingPath', () => {
	it('returns null when a canonical segment is missing', () => {
		expect(
			buildListingPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: null,
				slug: 'villa-example'
			})
		).toBeNull();
	});

	it('returns a 3-segment path for catch-all listings', () => {
		expect(
			buildListingPath({
				countrySlug: 'spain',
				locationSlug: 'nueva-andalucia',
				communitySlug: 'nueva-andalucia',
				slug: 'villa-example',
				isCatchAll: true
			})
		).toBe('/spain/nueva-andalucia/villa-example');
	});
});

describe('buildUnitPath', () => {
	it('builds a standard nested unit URL under its community', () => {
		expect(
			buildUnitPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella',
				developmentSlug: 'palo-alto',
				unitSlug: 'apartment-3b'
			})
		).toBe('/spain/costa-del-sol/marbella/palo-alto/apartment-3b');
	});

	it('builds a catch-all nested unit URL without the community segment', () => {
		expect(
			buildUnitPath({
				countrySlug: 'portugal',
				locationSlug: 'vilamoura',
				communitySlug: 'vilamoura',
				isCatchAll: true,
				developmentSlug: 'monte-rei',
				unitSlug: 'villa-12'
			})
		).toBe('/portugal/vilamoura/monte-rei/villa-12');
	});

	it('returns null when a parent path segment is missing', () => {
		expect(
			buildUnitPath({
				countrySlug: 'spain',
				locationSlug: null,
				communitySlug: 'marbella',
				developmentSlug: 'palo-alto',
				unitSlug: 'apartment-3b'
			})
		).toBeNull();
	});

	it('returns null when the unit slug is missing', () => {
		expect(
			buildUnitPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: 'marbella',
				developmentSlug: 'palo-alto',
				unitSlug: null
			})
		).toBeNull();
	});

	it('returns null for a standard (non-catch-all) unit missing its community', () => {
		expect(
			buildUnitPath({
				countrySlug: 'spain',
				locationSlug: 'costa-del-sol',
				communitySlug: null,
				developmentSlug: 'palo-alto',
				unitSlug: 'apartment-3b'
			})
		).toBeNull();
	});
});

describe('collectSitemapEntries units', () => {
	it('includes standard and catch-all unit URLs and carries lastmod', () => {
		const entries = collectSitemapEntries(
			[],
			[],
			[],
			[],
			[],
			[
				{
					countrySlug: 'spain',
					locationSlug: 'costa-del-sol',
					communitySlug: 'marbella',
					developmentSlug: 'palo-alto',
					unitSlug: 'apartment-3b',
					_updatedAt: '2026-07-01T00:00:00.000Z'
				},
				{
					countrySlug: 'portugal',
					locationSlug: 'vilamoura',
					communitySlug: 'vilamoura',
					isCatchAll: true,
					developmentSlug: 'monte-rei',
					unitSlug: 'villa-12',
					_updatedAt: '2026-07-02T00:00:00.000Z'
				}
			]
		);

		const paths = entries.map((entry) => entry.path);
		expect(paths).toContain('/spain/costa-del-sol/marbella/palo-alto/apartment-3b');
		expect(paths).toContain('/portugal/vilamoura/monte-rei/villa-12');

		const unit = entries.find((entry) => entry.path.endsWith('/apartment-3b'));
		expect(unit?.lastmod).toBe('2026-07-01T00:00:00.000Z');
	});

	it('drops units whose parent path or unit slug cannot resolve', () => {
		const entries = collectSitemapEntries(
			[],
			[],
			[],
			[],
			[],
			[
				// Missing locationSlug — parent path cannot resolve.
				{
					countrySlug: 'spain',
					locationSlug: null,
					communitySlug: 'marbella',
					developmentSlug: 'palo-alto',
					unitSlug: 'apartment-3b'
				},
				// Missing unit slug.
				{
					countrySlug: 'spain',
					locationSlug: 'costa-del-sol',
					communitySlug: 'marbella',
					developmentSlug: 'palo-alto',
					unitSlug: null
				}
			]
		);

		expect(entries.map((entry) => entry.path)).toEqual(
			expect.not.arrayContaining([expect.stringContaining('palo-alto')])
		);
	});

	it('de-duplicates a unit path shared across rows, keeping the latest lastmod', () => {
		const row = {
			countrySlug: 'spain',
			locationSlug: 'costa-del-sol',
			communitySlug: 'marbella',
			developmentSlug: 'palo-alto',
			unitSlug: 'apartment-3b'
		};
		const entries = collectSitemapEntries(
			[],
			[],
			[],
			[],
			[],
			[
				{ ...row, _updatedAt: '2026-07-01T00:00:00.000Z' },
				{ ...row, _updatedAt: '2026-07-05T00:00:00.000Z' }
			]
		);

		const matches = entries.filter(
			(entry) => entry.path === '/spain/costa-del-sol/marbella/palo-alto/apartment-3b'
		);
		expect(matches).toHaveLength(1);
		expect(matches[0].lastmod).toBe('2026-07-05T00:00:00.000Z');
	});
});

describe('sitemapUnitsQuery', () => {
	// The GROQ gate — not the path builder — is what keeps draft, in-review, archived, and
	// parent-unpublished units out of the sitemap. UNIT_PUBLISHABLE_FILTER requires both the
	// unit's own status and its parent development's status to be published (mirrored by
	// $publishedStatus). Assert the query composes that gate so the exclusion can't silently
	// regress to emitting non-200 unit URLs.
	it('selects only standalone unit documents', () => {
		expect(sitemapUnitsQuery).toContain('_type == "unit"');
	});

	it('gates on both the unit and its parent development being published', () => {
		expect(sitemapUnitsQuery).toContain('$publishedStatus');
		expect(sitemapUnitsQuery).toContain('parentDevelopment->status');
	});

	it('projects isCatchAll so catch-all unit paths match the 301 canonical', () => {
		expect(sitemapUnitsQuery).toContain('isCatchAll');
	});
});

describe('sitemapListingsQuery', () => {
	// Regression guard: the query MUST project isCatchAll. Without it, buildCanonicalPath
	// receives isCatchAll=undefined and emits the 4-segment community path for catch-all
	// listings (community slug == location, e.g. vilamoura/vilamoura), which then 301s to
	// the 3-segment canonical — putting redirecting URLs in the sitemap. The path builder
	// already handles isCatchAll (see buildListingPath above); only the query can regress.
	it('projects isCatchAll so emitted paths match the 301 canonical', () => {
		expect(sitemapListingsQuery).toContain('isCatchAll');
	});
});
