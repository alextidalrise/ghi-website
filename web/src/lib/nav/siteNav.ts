export type SiteNavItem = {
	label: string;
	href: string;
};

// The navigation is a curated, editorial set rather than a reflection of the full
// Sanity taxonomy: the two operating countries are surfaced directly, alongside the
// collection, the guide, and the about page. Contact is kept separate (see below) so
// it can render as a distinct call-to-action rather than a sixth text link.
export const SITE_NAV_ITEMS: SiteNavItem[] = [
	{ label: 'Spain', href: '/spain' },
	{ label: 'Portugal', href: '/portugal' },
	{ label: 'Front Line Collection', href: '/front-line-collection' },
	// Buying Guide page is not built yet; the nav links ahead of the page.
	{ label: 'Buying Guide', href: '/buying-guide' },
	{ label: 'About Us', href: '/about' }
];

// Contact page is not built yet; the nav links ahead of the page.
export const SITE_NAV_CTA: SiteNavItem = { label: 'Contact', href: '/contact' };

export function buildSiteNavItems(): SiteNavItem[] {
	return SITE_NAV_ITEMS;
}

/**
 * A nav item is active when the current path matches its href, or is nested beneath
 * it (e.g. `/spain/marbella` lights up "Spain"). The root `/` would match everything,
 * so it only ever matches exactly — but no nav item points at `/` today.
 */
export function isNavItemActive(href: string, pathname: string): boolean {
	if (href === '/') {
		return pathname === '/';
	}
	return pathname === href || pathname.startsWith(`${href}/`);
}
