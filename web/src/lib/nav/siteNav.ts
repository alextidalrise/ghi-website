import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import type { HeaderNav } from '$lib/sanity/queries/headerNav';

export type SiteNavLink = {
	label: string;
	href: string;
	external: boolean;
};

/**
 * A second-level entry. With no children it is a plain sub-item in a narrow dropdown;
 * with children it is a column in the wide panel (a country and its locations). The
 * flag stamp renders only for a country: `countrySlug` names the built-in fallback art,
 * `flag` the SVG an editor uploaded.
 */
export type SiteNavGroup = {
	label: string;
	/** Null when the group is a heading with no page of its own. */
	href: string | null;
	external: boolean;
	countrySlug: string | null;
	flag: string | null;
	children: SiteNavLink[];
};

export type SiteNavItem = {
	label: string;
	/** Null when the item only opens its dropdown (no destination of its own). */
	href: string | null;
	external: boolean;
	children: SiteNavGroup[];
};

export type SiteNav = {
	items: SiteNavItem[];
	cta: SiteNavLink;
};

/** A fallback country entry: links to the country page, flag from the built-in stamp art. */
function fallbackCountry(label: string, slug: string): SiteNavGroup {
	return { label, href: `/${slug}`, external: false, countrySlug: slug, flag: null, children: [] };
}

// Fallback menu — used only when no header navigation is configured in Sanity, so the
// header is never empty (a fresh dataset, or Sanity being unreachable). Countries sit
// under one "Countries" item, as the authored menu does; locations are editorial and
// only ever come from Sanity.
const FALLBACK_ITEMS: SiteNavItem[] = [
	{
		label: 'Countries',
		href: null,
		external: false,
		children: [fallbackCountry('Spain', 'spain'), fallbackCountry('Portugal', 'portugal')]
	},
	{ label: 'Front Line Collection', href: FRONTLINE_COLLECTION_PATH, external: false, children: [] },
	{ label: 'Buying Guide', href: '/guides', external: false, children: [] },
	{ label: 'Insights', href: '/insights', external: false, children: [] },
	{ label: 'About Us', href: '/about', external: false, children: [] }
];

const FALLBACK_CTA: SiteNavLink = { label: 'Contact', href: '/contact', external: false };

// The Footer reuses the Contact action as its closing invite. It is not part of the
// header menu that now lives in Sanity, so it stays anchored to the built-in CTA.
export const SITE_NAV_CTA: SiteNavLink = FALLBACK_CTA;

/**
 * Resolve the menu to render: the Sanity-authored nav when present, otherwise the
 * built-in fallback. The CTA falls back independently so a configured menu without its
 * own button still gets the Contact action.
 */
export function buildSiteNav(nav: HeaderNav | null | undefined): SiteNav {
	if (nav && nav.items.length > 0) {
		return {
			items: nav.items.map((item) => ({
				label: item.label,
				href: item.href,
				external: item.external,
				children: item.children.map((group) => ({
					label: group.label,
					href: group.href,
					external: group.external,
					countrySlug: group.countrySlug,
					flag: group.flag,
					children: group.children.map((child) => ({
						label: child.label,
						href: child.href,
						external: child.external
					}))
				}))
			})),
			cta: nav.cta ?? FALLBACK_CTA
		};
	}

	return { items: FALLBACK_ITEMS, cta: FALLBACK_CTA };
}

/**
 * A link is active when the current path matches its href, or is nested beneath it
 * (e.g. `/spain/marbella` lights up `/spain`). External links and the root `/` never
 * match by prefix — `/` would otherwise match everything. The query string is ignored so
 * a community link (`/spain/marbella?community=…`) compares on its path.
 */
export function isNavItemActive(href: string | null, pathname: string): boolean {
	if (!href) return false;
	if (href === '/') return pathname === '/';
	if (/^https?:\/\//.test(href)) return false;
	const path = href.split('?')[0];
	return pathname === path || pathname.startsWith(`${path}/`);
}

/** A group is active when its own href matches, or any of its children do. */
export function isSiteNavGroupActive(group: SiteNavGroup, pathname: string): boolean {
	if (isNavItemActive(group.href, pathname)) return true;
	return group.children.some((child) => isNavItemActive(child.href, pathname));
}

/** A top-level item is active when its own href matches, or anything beneath it does. */
export function isSiteNavItemActive(item: SiteNavItem, pathname: string): boolean {
	if (isNavItemActive(item.href, pathname)) return true;
	return item.children.some((group) => isSiteNavGroupActive(group, pathname));
}

/**
 * An item opens the wide panel (one column per group) when any group carries a third
 * tier; otherwise its dropdown is the narrow list. Hierarchy is decided by content, not
 * by label, so a "Countries" item with only country links stays a plain dropdown until
 * an editor curates locations beneath a country.
 */
export function hasPanel(item: SiteNavItem): boolean {
	return item.children.some((group) => group.children.length > 0);
}
