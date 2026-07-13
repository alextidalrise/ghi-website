import { describe, expect, it } from 'vitest';
import { buildSiteNav, isNavItemActive, isSiteNavItemActive, type SiteNavItem } from './siteNav';
import type { HeaderNav } from '$lib/sanity/queries/headerNav';

describe('buildSiteNav', () => {
	it('falls back to the curated editorial set when Sanity has no nav', () => {
		const { items, cta } = buildSiteNav(null);
		expect(items.map((item) => item.label)).toEqual([
			'Spain',
			'Portugal',
			'Front Line Collection',
			'Buying Guide',
			'Insights',
			'About Us'
		]);
		expect(cta).toEqual({ label: 'Contact', href: '/contact', external: false });
	});

	it('falls back when Sanity returns an empty item list', () => {
		const { items } = buildSiteNav({ items: [], cta: null });
		expect(items).toHaveLength(6);
	});

	it('uses the Sanity nav when present, preserving children and CTA', () => {
		const sanity: HeaderNav = {
			items: [
				{
					label: 'Spain',
					href: '/spain',
					external: false,
					children: [{ label: 'Marbella', href: '/spain/marbella', external: false }]
				}
			],
			cta: { label: 'Enquire', href: '/contact', external: false }
		};
		const { items, cta } = buildSiteNav(sanity);
		expect(items).toHaveLength(1);
		expect(items[0].children).toEqual([
			{ label: 'Marbella', href: '/spain/marbella', external: false }
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
	const item: SiteNavItem = {
		label: 'Spain',
		href: null,
		external: false,
		children: [{ label: 'Marbella', href: '/spain/marbella', external: false }]
	};

	it('is active when a child path is active even if the parent has no href', () => {
		expect(isSiteNavItemActive(item, '/spain/marbella')).toBe(true);
	});

	it('is inactive when neither the parent nor any child matches', () => {
		expect(isSiteNavItemActive(item, '/portugal')).toBe(false);
	});
});
