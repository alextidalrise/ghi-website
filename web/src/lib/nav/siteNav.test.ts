import { describe, expect, it } from 'vitest';
import {
	buildSiteNav,
	hasPanel,
	isNavItemActive,
	isSiteNavGroupActive,
	isSiteNavItemActive,
	type SiteNavGroup,
	type SiteNavItem
} from './siteNav';
import type { HeaderNav, HeaderNavGroup } from '$lib/sanity/queries/headerNav';

function group(partial: Partial<HeaderNavGroup> & { label: string }): HeaderNavGroup {
	return {
		href: null,
		external: false,
		countrySlug: null,
		flag: null,
		children: [],
		...partial
	};
}

describe('buildSiteNav', () => {
	it('falls back to the curated editorial set, countries folded under one item', () => {
		const { items, cta } = buildSiteNav(null);
		expect(items.map((item) => item.label)).toEqual([
			'Countries',
			'Front Line Collection',
			'Buying Guide',
			'Insights',
			'About Us'
		]);
		expect(items[0].href).toBeNull();
		expect(items[0].children.map((c) => [c.label, c.href, c.countrySlug])).toEqual([
			['Spain', '/spain', 'spain'],
			['Portugal', '/portugal', 'portugal']
		]);
		expect(cta).toEqual({ label: 'Contact', href: '/contact', external: false });
	});

	it('falls back when Sanity returns an empty item list', () => {
		const { items } = buildSiteNav({ items: [], cta: null });
		expect(items).toHaveLength(5);
	});

	it('uses the Sanity nav when present, preserving all three tiers and the CTA', () => {
		const sanity: HeaderNav = {
			items: [
				{
					label: 'Countries',
					href: null,
					external: false,
					children: [
						group({
							label: 'Spain',
							href: '/spain',
							countrySlug: 'spain',
							flag: 'https://cdn.example/es.svg',
							children: [{ label: 'Marbella', href: '/spain/marbella', external: false }]
						})
					]
				}
			],
			cta: { label: 'Enquire', href: '/contact', external: false }
		};
		const { items, cta } = buildSiteNav(sanity);
		expect(items).toHaveLength(1);
		expect(items[0].children).toEqual([
			{
				label: 'Spain',
				href: '/spain',
				external: false,
				countrySlug: 'spain',
				flag: 'https://cdn.example/es.svg',
				children: [{ label: 'Marbella', href: '/spain/marbella', external: false }]
			}
		]);
		expect(cta.label).toBe('Enquire');
	});

	it('falls back to the built-in CTA when a configured nav has none', () => {
		const sanity: HeaderNav = {
			items: [{ label: 'About', href: '/about', external: false, children: [] }],
			cta: null
		};
		expect(buildSiteNav(sanity).cta).toEqual({
			label: 'Contact',
			href: '/contact',
			external: false
		});
	});
});

describe('isNavItemActive', () => {
	it('matches an exact path', () => {
		expect(isNavItemActive('/spain', '/spain')).toBe(true);
	});

	it('matches a nested path', () => {
		expect(isNavItemActive('/spain', '/spain/marbella')).toBe(true);
	});

	it('ignores the query string when comparing', () => {
		expect(isNavItemActive('/spain/marbella?community=nueva', '/spain/marbella')).toBe(true);
	});

	it('does not match an unrelated or prefix-colliding path', () => {
		expect(isNavItemActive('/spain', '/portugal')).toBe(false);
		expect(isNavItemActive('/about', '/aboutus')).toBe(false);
	});

	it('never matches a null href or an external URL', () => {
		expect(isNavItemActive(null, '/spain')).toBe(false);
		expect(isNavItemActive('https://example.com', '/spain')).toBe(false);
	});

	it('only matches the root path exactly', () => {
		expect(isNavItemActive('/', '/')).toBe(true);
		expect(isNavItemActive('/', '/spain')).toBe(false);
	});
});

describe('isSiteNavItemActive', () => {
	const marbella = { label: 'Marbella', href: '/spain/marbella', external: false };
	const spain: SiteNavGroup = group({ label: 'Spain', href: '/spain', children: [marbella] });
	const item: SiteNavItem = { label: 'Countries', href: null, external: false, children: [spain] };

	it('is active when a grandchild path is active even if nothing above it has an href', () => {
		const headingOnly: SiteNavItem = {
			...item,
			children: [group({ label: 'Spain', children: [marbella] })]
		};
		expect(isSiteNavItemActive(headingOnly, '/spain/marbella')).toBe(true);
	});

	it('is active when a group path is active', () => {
		expect(isSiteNavItemActive(item, '/spain/estepona')).toBe(true);
	});

	it('is inactive when nothing beneath it matches', () => {
		expect(isSiteNavItemActive(item, '/portugal')).toBe(false);
	});

	it('lights a group for its own page and for its children', () => {
		expect(isSiteNavGroupActive(spain, '/spain')).toBe(true);
		expect(isSiteNavGroupActive(spain, '/spain/marbella')).toBe(true);
		expect(isSiteNavGroupActive(spain, '/portugal')).toBe(false);
	});
});

describe('hasPanel', () => {
	it('opens the wide panel only when a group carries a third tier', () => {
		const marbella = { label: 'Marbella', href: '/spain/marbella', external: false };
		const withLocations: SiteNavItem = {
			label: 'Countries',
			href: null,
			external: false,
			children: [group({ label: 'Spain', href: '/spain', children: [marbella] })]
		};
		const countriesOnly: SiteNavItem = {
			...withLocations,
			children: [group({ label: 'Spain', href: '/spain' })]
		};
		expect(hasPanel(withLocations)).toBe(true);
		// Countries with no curated locations stay a narrow dropdown — the fallback menu.
		expect(hasPanel(countriesOnly)).toBe(false);
		expect(hasPanel(buildSiteNav(null).items[0])).toBe(false);
	});
});
