import { defineQuery } from 'groq';
import { withoutCampaignParams } from '../href';
import { navHref, navExternal } from './navHref';
import { fetchPublic } from './fetch';

// Resolves a navLink to a concrete href. References become canonical paths derived from
// the linked doc's slug (country -> /spain, location -> /spain/marbella, community ->
// /spain/marbella?community=…, guide -> /guides/…); the manual styles pass straight
// through. The field is always named `link`, so the same fragment serves every level —
// the header items and the footer's labelled links alike (the footer query reuses these).
// The resolution itself lives in ./navHref so the insight hero link can reuse it verbatim.
export const NAV_HREF = navHref('link.');

export const NAV_EXTERNAL = navExternal('link.');

export const headerNavQuery = defineQuery(`
	*[_type == "siteSettings" && _id == "siteSettings"][0]{
		"items": coalesce(headerNav, [])[]{
			label,
			"href": ${NAV_HREF},
			"external": ${NAV_EXTERNAL},
			"children": coalesce(children, [])[]{
				label,
				"href": ${NAV_HREF},
				"external": ${NAV_EXTERNAL},
				"countrySlug": select(link.reference->type == "country" => link.reference->slug.current),
				"flag": select(link.reference->type == "country" => link.reference->flag.asset->url),
				"children": coalesce(children, [])[]{
					label,
					"href": ${NAV_HREF},
					"external": ${NAV_EXTERNAL}
				}
			}
		},
		"cta": headerCta{
			label,
			"href": ${NAV_HREF},
			"external": ${NAV_EXTERNAL}
		}
	}
`);

/** A resolved navigation link with a usable href. */
export type HeaderNavLink = {
	label: string;
	href: string;
	external: boolean;
};

/**
 * A second-level entry. A plain sub-item is a group with an href and no children; a
 * group proper (a country) may carry its own href plus a third tier of links. When the
 * group links to a country document, `countrySlug` and `flag` let the header show the
 * same flag stamp the homepage country index uses (flag may still be null before an
 * editor uploads one — the stamp then falls back by slug).
 */
export type HeaderNavGroup = {
	label: string;
	href: string | null;
	external: boolean;
	countrySlug: string | null;
	flag: string | null;
	children: HeaderNavLink[];
};

/** A top-level item: may have no href of its own (dropdown-only), plus optional children. */
export type HeaderNavItem = {
	label: string;
	href: string | null;
	external: boolean;
	children: HeaderNavGroup[];
};

export type HeaderNav = {
	items: HeaderNavItem[];
	cta: HeaderNavLink | null;
};

// The raw, pre-cleaned shape coming back from GROQ — any field can be missing or null.
type RawLink = { label?: string | null; href?: string | null; external?: boolean | null };
type RawGroup = RawLink & {
	countrySlug?: string | null;
	flag?: string | null;
	children?: RawLink[] | null;
};
type RawItem = RawLink & { children?: RawGroup[] | null };
type RawHeaderNav = { items?: RawItem[] | null; cta?: RawLink | null } | null;

// Campaign tags are stripped as the raw href becomes a typed link, alongside the other
// cleaning these transforms do. A `utm_*` on a menu link would re-attribute the visitor's
// GA4 session on every navigation, and the nav is on every page — see `$lib/sanity/href`.
function toLink(raw: RawLink | null | undefined): HeaderNavLink | null {
	if (!raw?.label || !raw.href) return null;
	return {
		label: raw.label,
		href: withoutCampaignParams(raw.href),
		external: Boolean(raw.external)
	};
}

// A group earns a place the same way an item does: by leading somewhere — its own link,
// a third tier of links, or both. Its children are always real links.
function toGroup(raw: RawGroup | null | undefined): HeaderNavGroup | null {
	if (!raw?.label) return null;
	const children = (raw.children ?? []).flatMap((c) => {
		const link = toLink(c);
		return link ? [link] : [];
	});
	if (!raw.href && children.length === 0) return null;
	return {
		label: raw.label,
		href: raw.href ? withoutCampaignParams(raw.href) : null,
		external: Boolean(raw.external),
		countrySlug: raw.countrySlug ?? null,
		flag: raw.flag ?? null,
		children
	};
}

function toItem(raw: RawItem | null | undefined): HeaderNavItem | null {
	if (!raw?.label) return null;
	const children = (raw.children ?? []).flatMap((c) => {
		const group = toGroup(c);
		return group ? [group] : [];
	});
	// An item earns a place only if it leads somewhere — a real link, a dropdown, or both.
	if (!raw.href && children.length === 0) return null;
	return {
		label: raw.label,
		href: raw.href ? withoutCampaignParams(raw.href) : null,
		external: Boolean(raw.external),
		children
	};
}

/**
 * The header navigation as configured in Sanity. Returns null when nothing usable is
 * authored, so the caller can fall back to the built-in default menu rather than render
 * an empty header.
 */
export async function fetchHeaderNav(): Promise<HeaderNav | null> {
	const result = await fetchPublic<RawHeaderNav>(headerNavQuery);
	if (!result) return null;

	const items = (result.items ?? []).flatMap((item) => {
		const mapped = toItem(item);
		return mapped ? [mapped] : [];
	});
	if (items.length === 0) return null;

	return { items, cta: toLink(result.cta) };
}
