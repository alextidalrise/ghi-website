import type { FooterColumn, FooterContent, FooterLink, FooterSocial } from '$lib/sanity/queries';

/** The footer, with every part guaranteed present — ready to render. */
export type ResolvedFooter = {
	brandStatement: string;
	inviteLead: string;
	invite: FooterLink;
	columns: FooterColumn[];
	legalLinks: FooterLink[];
	socials: FooterSocial[];
};

// Built-in defaults — the footer the site shipped with before it moved into Sanity. Used
// when nothing is authored, or to fill an individual piece an editor left blank, so the
// footer is never empty (a fresh dataset, or Sanity being unreachable). The geography
// fallback is intentionally light: once the footer is authored in Sanity, those columns
// carry the full country/location index.
const FALLBACK: ResolvedFooter = {
	brandStatement:
		'Curated residential property on and near the finest golf courses of Spain and Portugal.',
	inviteLead: 'Considering a move?',
	invite: { label: 'Make an enquiry', href: '/contact', external: false },
	columns: [
		{
			heading: 'Spain',
			links: [],
			highlight: { label: 'Explore Spain', href: '/spain', external: false }
		},
		{
			heading: 'Portugal',
			links: [],
			highlight: { label: 'Explore Portugal', href: '/portugal', external: false }
		},
		{
			heading: 'Explore',
			links: [
				{ label: 'Front Line Collection', href: '/front-line-collection', external: false },
				{ label: 'Buying Guide', href: '/guides', external: false },
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
 * Resolve the footer to render: the Sanity-authored content when present, otherwise the
 * built-in default. Each scalar piece (statement, invitation) falls back independently so
 * an editor who fills only the columns still gets a sensible brand line and CTA; the link
 * groups are used as authored once any footer content exists.
 */
export function buildFooter(content: FooterContent | null | undefined): ResolvedFooter {
	if (!content) return FALLBACK;

	return {
		brandStatement: content.brandStatement ?? FALLBACK.brandStatement,
		inviteLead: content.inviteLead ?? FALLBACK.inviteLead,
		invite: content.invite ?? FALLBACK.invite,
		columns: content.columns.length > 0 ? content.columns : FALLBACK.columns,
		legalLinks: content.legalLinks.length > 0 ? content.legalLinks : FALLBACK.legalLinks,
		socials: content.socialLinks
	};
}
