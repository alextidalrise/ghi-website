import { defineQuery } from 'groq';
import { fetchPublic } from './fetch';
import { NAV_HREF, NAV_EXTERNAL } from './headerNav';

// The footer is authored on the siteSettings singleton, alongside the header menu. Each
// labelled link is a navMenuChild, so it resolves through the same NAV_HREF/NAV_EXTERNAL
// fragments the header uses — references stay correct if a slug later changes.
const FOOTER_LINK = `{
		label,
		"href": ${NAV_HREF},
		"external": ${NAV_EXTERNAL}
	}`;

export const footerQuery = defineQuery(`
	*[_type == "siteSettings" && _id == "siteSettings"][0].footer{
		brandStatement,
		inviteLead,
		"invite": inviteCta${FOOTER_LINK},
		"columns": coalesce(columns, [])[]{
			heading,
			"links": coalesce(links, [])[]${FOOTER_LINK},
			"highlight": highlightLink${FOOTER_LINK}
		},
		"legalLinks": coalesce(legalLinks, [])[]${FOOTER_LINK},
		"socialLinks": coalesce(socialLinks, [])[]{ platform, url }
	}
`);

/** A resolved, usable footer link. */
export type FooterLink = {
	label: string;
	href: string;
	external: boolean;
};

/** One index column: a heading, its links, and an optional emphasised "All X →" link. */
export type FooterColumn = {
	heading: string;
	links: FooterLink[];
	highlight: FooterLink | null;
};

export type FooterSocialPlatform = 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'x';

export type FooterSocial = {
	platform: FooterSocialPlatform;
	url: string;
};

/** The footer content as authored in Sanity — any part may be absent. */
export type FooterContent = {
	brandStatement: string | null;
	inviteLead: string | null;
	invite: FooterLink | null;
	columns: FooterColumn[];
	legalLinks: FooterLink[];
	socialLinks: FooterSocial[];
};

// The raw GROQ shape: every field can be missing or null.
type RawLink = { label?: string | null; href?: string | null; external?: boolean | null };
type RawColumn = { heading?: string | null; links?: RawLink[] | null; highlight?: RawLink | null };
type RawSocial = { platform?: string | null; url?: string | null };
type RawFooter = {
	brandStatement?: string | null;
	inviteLead?: string | null;
	invite?: RawLink | null;
	columns?: RawColumn[] | null;
	legalLinks?: RawLink[] | null;
	socialLinks?: RawSocial[] | null;
} | null;

const SOCIAL_PLATFORMS: FooterSocialPlatform[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'x'];

function toLink(raw: RawLink | null | undefined): FooterLink | null {
	if (!raw?.label || !raw.href) return null;
	return { label: raw.label, href: raw.href, external: Boolean(raw.external) };
}

function toColumn(raw: RawColumn | null | undefined): FooterColumn | null {
	if (!raw?.heading) return null;
	const links = (raw.links ?? []).flatMap((l) => {
		const link = toLink(l);
		return link ? [link] : [];
	});
	const highlight = toLink(raw.highlight);
	// A column with no usable links and no highlight has nothing to show.
	if (links.length === 0 && !highlight) return null;
	return { heading: raw.heading, links, highlight };
}

function toSocial(raw: RawSocial | null | undefined): FooterSocial | null {
	if (!raw?.url || !raw.platform) return null;
	if (!SOCIAL_PLATFORMS.includes(raw.platform as FooterSocialPlatform)) return null;
	return { platform: raw.platform as FooterSocialPlatform, url: raw.url };
}

/**
 * The footer content configured in Sanity. Returns null when nothing usable is authored,
 * so the caller falls back to the built-in defaults rather than render an empty footer.
 */
export async function fetchFooter(): Promise<FooterContent | null> {
	const raw = await fetchPublic<RawFooter>(footerQuery);
	if (!raw) return null;

	const columns = (raw.columns ?? []).flatMap((c) => {
		const column = toColumn(c);
		return column ? [column] : [];
	});
	const legalLinks = (raw.legalLinks ?? []).flatMap((l) => {
		const link = toLink(l);
		return link ? [link] : [];
	});
	const socialLinks = (raw.socialLinks ?? []).flatMap((s) => {
		const social = toSocial(s);
		return social ? [social] : [];
	});

	const content: FooterContent = {
		brandStatement: raw.brandStatement ?? null,
		inviteLead: raw.inviteLead ?? null,
		invite: toLink(raw.invite),
		columns,
		legalLinks,
		socialLinks
	};

	// Nothing authored at all — let the caller use the built-in fallback.
	const empty =
		!content.brandStatement &&
		!content.inviteLead &&
		!content.invite &&
		columns.length === 0 &&
		legalLinks.length === 0 &&
		socialLinks.length === 0;

	return empty ? null : content;
}
