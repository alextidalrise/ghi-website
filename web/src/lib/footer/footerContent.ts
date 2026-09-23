import type { FooterColumn, FooterContent, FooterLink, FooterSocial } from '$lib/sanity/queries';
import type { SiteNav } from '$lib/nav/siteNav';

/**
 * One row of the footer's country index: the country (its name is the link to its page)
 * and the locations beneath it, inline. The geography is not authored for the footer; it
 * is read from the header's country groups, so one Studio edit moves both.
 */
export type FooterCountry = {
	name: string;
	/** Country slug: names the built-in flag art when no flag is uploaded. */
	slug: string;
	/** The flag SVG an editor uploaded, as the header shelf shows it. */
	flag: string | null;
	href: string | null;
	external: boolean;
	locations: FooterLink[];
};

/** The footer, with every part guaranteed present — ready to render. */
export type ResolvedFooter = {
	brandStatement: string;
	inviteLead: string;
	invite: FooterLink;
	countries: FooterCountry[];
	columns: FooterColumn[];
	legalLinks: FooterLink[];
	socials: FooterSocial[];
};

// Built-in defaults — the footer the site shipped with before it moved into Sanity. Used
// when nothing is authored, or to fill an individual piece an editor left blank, so the
// footer is never empty (a fresh dataset, or Sanity being unreachable). There is no
// geography here: countries come from the header nav, which has its own fallback.
const FALLBACK: Omit<ResolvedFooter, 'countries'> = {
	brandStatement:
		"Curated residential property on and near the world's finest golf courses.",
	inviteLead: 'Considering a move?',
	invite: { label: 'Make an enquiry', href: '/contact', external: false },
	columns: [
		{
			heading: 'Explore',
			links: [
				{ label: 'Front Line Collection', href: '/front-line-collection', external: false },
				{ label: 'Buying Guides', href: '/guides', external: false },
				{ label: 'About Us', href: '/about', external: false },
				{ label: 'Contact', href: '/contact', external: false }
			],
			highlight: null
		}
	],
	legalLinks: [
		{ label: 'Privacy', href: '/privacy', external: false },
		{ label: 'Terms', href: '/terms', external: false }
	],
	socials: [
		{ platform: 'instagram', url: 'https://www.instagram.com/golfhomesinternational' }
	]
};

/**
 * The country index, read from the resolved header nav: every group that links to a
 * country document, in the header's own order, with its locations. A country listed
 * under two items (unlikely, but the menu is authored) appears once.
 */
export function footerCountries(nav: SiteNav): FooterCountry[] {
	const seen = new Set<string>();
	const countries: FooterCountry[] = [];
	for (const item of nav.items) {
		for (const group of item.children) {
			if (!group.countrySlug || seen.has(group.countrySlug)) continue;
			seen.add(group.countrySlug);
			countries.push({
				name: group.label,
				slug: group.countrySlug,
				flag: group.flag,
				href: group.href,
				external: group.external,
				locations: group.children
			});
		}
	}
	return countries;
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Resolve the footer to render: the Sanity-authored content when present, otherwise the
 * built-in default. Each scalar piece (statement, invitation) falls back independently so
 * an editor who fills only the columns still gets a sensible brand line and CTA; the link
 * groups are used as authored once any footer content exists.
 *
 * Authored columns headed with a country the index already lists are dropped. Before the
 * index existed, the footer's geography was one hand-built column per country; those
 * columns would now repeat the index, and dropping them here means the code can ship
 * before an editor clears them out of Studio.
 */
export function buildFooter(
	content: FooterContent | null | undefined,
	countries: FooterCountry[] = []
): ResolvedFooter {
	if (!content) return { ...FALLBACK, countries };

	const columns = content.columns.filter(
		(column) => !countries.some((country) => sameName(country.name, column.heading))
	);
	return {
		brandStatement: content.brandStatement ?? FALLBACK.brandStatement,
		inviteLead: content.inviteLead ?? FALLBACK.inviteLead,
		invite: content.invite ?? FALLBACK.invite,
		countries,
		columns: columns.length > 0 ? columns : FALLBACK.columns,
		legalLinks: content.legalLinks.length > 0 ? content.legalLinks : FALLBACK.legalLinks,
		socials: content.socialLinks
	};
}
