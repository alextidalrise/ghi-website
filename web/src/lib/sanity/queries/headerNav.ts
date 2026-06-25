import { defineQuery } from 'groq';
import { fetchPublic } from './fetch';

// Resolves a navLink to a concrete href. References become canonical paths derived from
// the linked doc's slug (country -> /spain, location -> /spain/marbella, community ->
// /spain/marbella?community=…, guide -> /guides/…); the manual styles pass straight
// through. The field is always named `link`, so the same fragment serves every level.
const NAV_HREF = `select(
		link.linkType == "external" => link.externalUrl,
		link.linkType == "internal" => link.internalPath,
		link.linkType == "reference" && link.reference->_type == "guide" => "/guides/" + link.reference->slug.current,
		link.linkType == "reference" && link.reference->type == "country" => "/" + link.reference->slug.current,
		link.linkType == "reference" && link.reference->type == "location" => "/" + link.reference->parent->slug.current + "/" + link.reference->slug.current,
		link.linkType == "reference" && link.reference->type == "community" => "/" + link.reference->parent->parent->slug.current + "/" + link.reference->parent->slug.current + "?community=" + link.reference->slug.current
	)`;

const NAV_EXTERNAL = `link.linkType == "external"`;

export const headerNavQuery = defineQuery(`
	*[_type == "siteSettings" && _id == "siteSettings"][0]{
		"items": coalesce(headerNav, [])[]{
			label,
			"href": ${NAV_HREF},
			"external": ${NAV_EXTERNAL},
			"children": coalesce(children, [])[]{
				label,
				"href": ${NAV_HREF},
				"external": ${NAV_EXTERNAL}
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

/** A top-level item: may have no href of its own (dropdown-only), plus optional children. */
export type HeaderNavItem = {
	label: string;
	href: string | null;
	external: boolean;
	children: HeaderNavLink[];
};

export type HeaderNav = {
	items: HeaderNavItem[];
	cta: HeaderNavLink | null;
};

// The raw, pre-cleaned shape coming back from GROQ — any field can be missing or null.
type RawLink = { label?: string | null; href?: string | null; external?: boolean | null };
type RawItem = RawLink & { children?: RawLink[] | null };
type RawHeaderNav = { items?: RawItem[] | null; cta?: RawLink | null } | null;

function toLink(raw: RawLink | null | undefined): HeaderNavLink | null {
	if (!raw?.label || !raw.href) return null;
	return { label: raw.label, href: raw.href, external: Boolean(raw.external) };
}

function toItem(raw: RawItem | null | undefined): HeaderNavItem | null {
	if (!raw?.label) return null;
	const children = (raw.children ?? []).flatMap((c) => {
		const link = toLink(c);
		return link ? [link] : [];
	});
	// An item earns a place only if it leads somewhere — a real link, a dropdown, or both.
	if (!raw.href && children.length === 0) return null;
	return {
		label: raw.label,
		href: raw.href ?? null,
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
