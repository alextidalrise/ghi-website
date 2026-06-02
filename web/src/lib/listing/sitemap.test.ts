import { describe, expect, it } from 'vitest';
import {
	buildListingPath,
	buildTaxonomyPath,
	collectSitemapEntries,
	renderSitemapXml
} from './sitemap';

describe('buildTaxonomyPath', () => {
	it('builds country and location paths; community taxonomy is not indexed', () => {
		expect(buildTaxonomyPath({ type: 'country', countrySlug: 'spain' })).toBe('/spain');
		expect(
			buildTaxonomyPath({
				type: 'location',
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
});

describe('collectSitemapEntries', () => {
	it('deduplicates paths and includes homepage plus listing canonical paths', () => {
		const entries = collectSitemapEntries(
			[
				{ type: 'country', countrySlug: 'spain', _updatedAt: '2026-05-01T00:00:00.000Z' },
				{
					type: 'location',
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

		expect(entries.map((entry) => entry.path)).toEqual([
			'/',
			'/spain',
			'/spain/costa-del-sol',
			'/spain/costa-del-sol/marbella/villa-example'
		]);

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
});
