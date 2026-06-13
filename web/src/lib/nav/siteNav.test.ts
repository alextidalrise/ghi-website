import { describe, expect, it } from 'vitest';
import { buildSiteNavItems, isNavItemActive, SITE_NAV_CTA } from './siteNav';

describe('buildSiteNavItems', () => {
	it('surfaces the curated editorial link set', () => {
		expect(buildSiteNavItems()).toEqual([
			{ label: 'Spain', href: '/spain' },
			{ label: 'Portugal', href: '/portugal' },
			{ label: 'Front Line Collection', href: '/front-line-collection' },
			{ label: 'Buying Guide', href: '/guides' },
			{ label: 'About Us', href: '/about' }
		]);
	});

	it('keeps Contact as a separate call-to-action', () => {
		expect(SITE_NAV_CTA).toEqual({ label: 'Contact', href: '/contact' });
	});
});

describe('isNavItemActive', () => {
	it('matches an exact path', () => {
		expect(isNavItemActive('/spain', '/spain')).toBe(true);
	});

	it('matches a nested path', () => {
		expect(isNavItemActive('/spain', '/spain/marbella')).toBe(true);
	});

	it('does not match an unrelated or prefix-colliding path', () => {
		expect(isNavItemActive('/spain', '/portugal')).toBe(false);
		expect(isNavItemActive('/about', '/aboutus')).toBe(false);
	});

	it('only matches the root path exactly', () => {
		expect(isNavItemActive('/', '/')).toBe(true);
		expect(isNavItemActive('/', '/spain')).toBe(false);
	});
});
