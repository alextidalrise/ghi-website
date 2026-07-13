import { FRONTLINE_COLLECTION_PATH } from '$lib/listing/routes';
import type { HeaderNav } from '$lib/sanity/queries/headerNav';

export type SiteNavLink = {
	label: string;
	href: string;
	external: boolean;
};

export type SiteNavItem = {
	label: string;
	/** Null when the item only opens its dropdown (no destination of its own). */
	href: string | null;
	external: boolean;
	children: SiteNavLink[];
};

export type SiteNav = {
	items: SiteNavItem[];
	cta: SiteNavLink;
};

// Fallback menu — used only when no header navigation is configured in Sanity, so the
// header is never empty (a fresh dataset, or Sanity being unreachable). This mirrors the
// curated editorial set the nav shipped with before it moved into the CMS.
const FALLBACK_ITEMS: SiteNavItem[] = [
	{ label: 'Spain', href: '/spain', external: false, children: [] },
	{ label: 'Portugal', href: '/portugal', external: false, children: [] },
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
				children: item.children.map((child) => ({
					label: child.label,
					href: child.href,
					external: child.external
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

/** A top-level item is active when its own href matches, or any of its children do. */
export function isSiteNavItemActive(item: SiteNavItem, pathname: string): boolean {
	if (isNavItemActive(item.href, pathname)) return true;
	return item.children.some((child) => isNavItemActive(child.href, pathname));
}
