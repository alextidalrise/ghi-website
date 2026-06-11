/**
 * The vetted partner network shown on /partners.
 *
 * Authored here for now (Sanity-ready shape, mirroring how the homepage's
 * TrustedPartner list works) so partners can be added without a content model.
 * One partner per category today; a category simply renders more cards as the
 * network grows.
 *
 * Every buyer-facing call to action routes through a GHI introduction request,
 * never straight to the partner. The partner's own destination (a booking link
 * or referral URL) lives in `referralUrl` for the GHI team's handoff and is not
 * surfaced to visitors.
 */

export type Partner = {
	/** Stable id; also the value passed to the introduction request. */
	slug: string;
	name: string;
	/** One tight paragraph, brand voice. */
	description: string;
	/** Where the partner operates; shown as a quiet label on the card. */
	coverage: string;
	/** Optional logo asset path. Absent → the placeholder cell renders. */
	logo?: string;
	/** Partner's own destination, stored for the GHI handoff. Never buyer-facing. */
	referralUrl?: string;
};

export type PartnerCategory = {
	id: string;
	/** Category name, e.g. "Legal & Tax". */
	name: string;
	/** Single initial for the wayfinding monogram. */
	monogram: string;
	/** One line on what this category covers. */
	role: string;
	partners: Partner[];
};

export const PARTNER_CATEGORIES: PartnerCategory[] = [
	{
		id: 'legal-tax',
		name: 'Legal & Tax',
		monogram: 'L',
		role: 'Property law, conveyancing and cross-border taxation',
		partners: [
			{
				slug: 'franke-de-la-fuente',
				name: 'Franke de la Fuente',
				coverage: 'Spain · Costa del Sol',
				description:
					'A law firm guiding international clients through property purchases, relocation and Spanish taxation. Technical depth paired with clear, accessible advice, delivered by a multilingual team with offices in Marbella, Estepona and Fuengirola.'
			}
		]
	},
	{
		id: 'wealth-management',
		name: 'Wealth Management',
		monogram: 'W',
		role: 'Cross-border financial planning and retirement',
		partners: [
			{
				slug: 'atlas-bridge-wealth',
				name: 'Atlas Bridge Wealth',
				coverage: 'Spain & Portugal',
				description:
					'A boutique, fee-based financial planning firm based in Portugal, advising internationally minded families on pensions, investments, retirement and long-term wealth structuring across multiple jurisdictions.',
				referralUrl: 'https://calendly.com/steve-atlasbridgewealth'
			}
		]
	},
	{
		id: 'mortgage',
		name: 'Mortgage',
		monogram: 'M',
		role: 'Finance for non-resident and international buyers',
		partners: [
			{
				slug: 'foxes-finance-legal',
				name: 'Foxes Finance & Legal',
				coverage: 'Spain · Portugal on referral',
				description:
					'A Spanish mortgage brokerage helping international buyers secure finance for property in Spain, from affordability and lender eligibility through to mortgage offers and the key stages of completion.',
				referralUrl: 'https://foxes.es/get-started/'
			}
		]
	},
	{
		id: 'currency-exchange',
		name: 'Currency Exchange',
		monogram: 'C',
		role: 'Moving money across borders for a purchase',
		partners: [
			{
				slug: 'fiberpay',
				name: 'Fiberpay',
				coverage: 'Spain & Portugal',
				description:
					'Specialist currency transfers for property buyers moving money internationally. Competitive rates and guided, high-value transactions, with a more personal alternative to the high-street banks.',
				referralUrl:
					'https://fiberpay.com/?utm_source=Nueva+Vida&utm_medium=Referral&utm_campaign=Partner'
			}
		]
	},
	{
		id: 'project-management',
		name: 'Project Management',
		monogram: 'P',
		role: 'Build, renovation and handover oversight',
		partners: [
			{
				slug: 'nueva-vida-group',
				name: 'Nueva Vida Group',
				coverage: 'Spain & Portugal',
				description:
					'A full project management service acting as your representative from first concept to final handover. The team coordinates designers, contractors and specialists across design, construction, procurement and delivery.'
			}
		]
	},
	{
		id: 'rental-investment',
		name: 'Rental & Investment',
		monogram: 'R',
		role: 'Managed buy-to-let and rental portfolios',
		partners: [
			{
				slug: 'olive-grove-partners',
				name: 'Olive Grove Partners',
				coverage: 'Marbella & Nueva Andalucía',
				description:
					'A vertically integrated rental investment platform across Marbella and Nueva Andalucía. Owning and managing the whole chain, from acquisition and marketing to operations and exit, for short and long-term lets.'
			}
		]
	},
	{
		id: 'holiday-rentals',
		name: 'Holiday Rentals',
		monogram: 'H',
		role: 'Short-let management for second homes',
		partners: [
			{
				slug: 'albany-global-property',
				name: 'Albany Global Property',
				coverage: 'Spain & Portugal',
				description:
					'A curated collection of holiday homes in sought-after destinations. Standout architecture and rare settings, with a signature service that manages every stay from arrival to departure.'
			}
		]
	}
];

/** Buyer-facing introduction-request link for a partner. */
export function partnerIntroHref(partner: Partner): string {
	return `/contact?partner=${encodeURIComponent(partner.slug)}`;
}
