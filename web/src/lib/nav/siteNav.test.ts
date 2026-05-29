import { describe, expect, it } from 'vitest';
import { buildSiteNavItems, DEFAULT_PRIMARY_COUNTRY_SLUG } from './siteNav';

describe('buildSiteNavItems', () => {
	it('builds real hrefs from the primary country slug', () => {
		expect(buildSiteNavItems('spain')).toEqual([
			{ label: 'Properties', href: '/' },
			{ label: 'Destinations', href: '/spain' },
			{ label: 'Golf', href: '/spain?golfRelevance=frontline_golf' },
			{ label: 'About', href: '/about' }
		]);
	});

	it('falls back to spain when the slug is empty', () => {
		const items = buildSiteNavItems('');
		expect(items[1]?.href).toBe(`/${DEFAULT_PRIMARY_COUNTRY_SLUG}`);
	});
});
