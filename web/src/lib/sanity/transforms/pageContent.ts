import {
	GUIDE_CATEGORY_META,
	type GuideCategoryMeta
} from '$lib/guides/categories';
import type { GuideCategory } from '$lib/guides/types';
import { withoutCampaignParams } from '../href';
import type { MediaAssetInput } from './mediaFilter';

type SeoInput = {
	seoTitle?: string | null;
	metaDescription?: string | null;
	openGraphTitle?: string | null;
	openGraphDescription?: string | null;
	noindex?: boolean | null;
} | null;

const s = (value: string | null | undefined, fallback: string): string =>
	value?.trim() || fallback;

// ---------------------------------------------------------------------------
// Homepage
// ---------------------------------------------------------------------------

export type HomepageContentInput = {
	heroHeadline?: string | null;
	buyerIntroHeading?: string | null;
	buyerIntroDeck?: string | null;
	buyerIntroCta?: string | null;
	featuredHeading?: string | null;
	featuredSummary?: string | null;
	frontlineHeading?: string | null;
	frontlineSummary?: string | null;
	destinationsHeading?: string | null;
	partnersHeading?: string | null;
	partnersSubhead?: string | null;
	partnersCta?: string | null;
	partnersCtaSupport?: string | null;
	reviewsHeading?: string | null;
	reviewsDeck?: string | null;
	seo?: SeoInput;
};

export type HomepageContent = {
	heroHeadline: string;
	buyerIntroHeading: string;
	buyerIntroDeck: string;
	buyerIntroCta: string;
	featuredHeading: string;
	featuredSummary: string;
	frontlineHeading: string;
	frontlineSummary: string;
	destinationsHeading: string;
	partnersHeading: string;
	partnersSubhead: string;
	partnersCta: string;
	partnersCtaSupport: string;
	reviewsHeading: string;
	reviewsDeck: string;
	seo: SeoInput;
};

export function resolveHomepageContent(input: HomepageContentInput | null): HomepageContent {
	return {
		heroHeadline: s(input?.heroHeadline, 'Homes beside\n*the fairway*'),
		buyerIntroHeading: s(input?.buyerIntroHeading, 'Everything to know before you buy'),
		buyerIntroDeck: s(
			input?.buyerIntroDeck,
			'The process, the costs, the tax and the mortgage — set out plainly for non-resident buyers, market by market.'
		),
		buyerIntroCta: s(input?.buyerIntroCta, "Read the buyer's guides"),
		featuredHeading: s(input?.featuredHeading, 'Featured properties'),
		featuredSummary: s(
			input?.featuredSummary,
			'Hand-picked listings from every market we cover.'
		),
		frontlineHeading: s(input?.frontlineHeading, 'Frontline Golf Properties'),
		frontlineSummary: s(
			input?.frontlineSummary,
			'Homes directly on the fairway, wherever we operate.'
		),
		destinationsHeading: s(input?.destinationsHeading, 'Explore by country'),
		partnersHeading: s(input?.partnersHeading, 'Trusted Partners'),
		partnersSubhead: s(
			input?.partnersSubhead,
			'Legal, financial and local expertise in every region we cover.'
		),
		partnersCta: s(input?.partnersCta, 'Request introduction'),
		partnersCtaSupport: s(
			input?.partnersCtaSupport,
			"Tell us what you need and we'll connect you with the right specialist."
		),
		reviewsHeading: s(input?.reviewsHeading, 'From keys-in-hand buyers'),
		reviewsDeck: s(
			input?.reviewsDeck,
			"Real reviews from people who've bought golf property with us."
		),
		seo: input?.seo ?? null
	};
}

// ---------------------------------------------------------------------------
// Front Line Collection
// ---------------------------------------------------------------------------

export type FrontlineContentInput = {
	ctaLabel?: string | null;
	resultsHeading?: string | null;
	seo?: SeoInput;
};

export type FrontlineContent = {
	ctaLabel: string;
	resultsHeading: string;
	seo: SeoInput;
};

export function resolveFrontlineContent(input: FrontlineContentInput | null): FrontlineContent {
	return {
		ctaLabel: s(input?.ctaLabel, 'Browse the collection'),
		resultsHeading: s(input?.resultsHeading, 'Frontline golf homes'),
		seo: input?.seo ?? null
	};
}

// ---------------------------------------------------------------------------
// Guides hub
// ---------------------------------------------------------------------------

export type GuidesHubCategoryInput = {
	key?: string | null;
	label?: string | null;
	blurb?: string | null;
};

export type GuidesHubPageInput = {
	heroTitle?: string | null;
	heroLead?: string | null;
	sectionHeading?: string | null;
	categories?: GuidesHubCategoryInput[] | null;
	emptyStateMessage?: string | null;
	seo?: SeoInput;
};

export type GuidesHubContent = {
	heroTitle: string;
	heroLead: string;
	sectionHeading: string;
	categoryMeta: Record<string, GuideCategoryMeta>;
	emptyStateMessage: string;
	seo: SeoInput;
};

export function resolveGuidesHubContent(input: GuidesHubPageInput | null): GuidesHubContent {
	const categoryMeta: Record<string, GuideCategoryMeta> = { ...GUIDE_CATEGORY_META };

	if (input?.categories) {
		for (const cat of input.categories) {
			if (!cat.key) continue;
			const existing = GUIDE_CATEGORY_META[cat.key as GuideCategory];
			categoryMeta[cat.key] = {
				label: s(cat.label, existing?.label ?? cat.key),
				blurb: s(cat.blurb, existing?.blurb ?? '')
			};
		}
	}

	return {
		heroTitle: s(input?.heroTitle, 'Guides'),
		heroLead: s(
			input?.heroLead,
			'Considered, current guidance on buying and owning a home near the world\'s finest golf, market by market.'
		),
		sectionHeading: s(input?.sectionHeading, 'Where to start'),
		categoryMeta,
		emptyStateMessage: s(
			input?.emptyStateMessage,
			'The first guides are being written. Check back shortly.'
		),
		seo: input?.seo ?? null
	};
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

export type PartnersPageInput = {
	heroTitle?: string | null;
	heroLead?: string | null;
	heroMarkers?: string[] | null;
	whyHeading?: string | null;
	whyBody?: string | null;
	whyAttributes?: string[] | null;
	becomeHeading?: string | null;
	becomeBody?: string | null;
	becomeCta?: string | null;
	becomeSupport?: string | null;
	seo?: SeoInput;
};

export type PartnersPageContent = {
	heroTitle: string;
	heroLead: string;
	heroMarkers: string[];
	whyHeading: string;
	whyBody: string;
	whyAttributes: string[];
	becomeHeading: string;
	becomeBody: string;
	becomeCta: string;
	becomeSupport: string;
	seo: SeoInput;
};

/**
 * Defaults for /partners, which until now had no Sanity singleton at all — its copy was
 * literal in the Svelte component, which is why it still read "across Spain and Portugal"
 * two markets after that stopped being true.
 *
 * These follow the market copy rule: prose never enumerates markets, structure does. The
 * coverage filter directly beneath this hero lists the countries from live data, so the
 * lead does not name them and cannot go stale.
 */
export function resolvePartnersPageContent(
	input: PartnersPageInput | null
): PartnersPageContent {
	return {
		heroTitle: s(input?.heroTitle, 'Our Trusted Partners'),
		heroLead: s(
			input?.heroLead,
			'Independent legal, tax, financial and property professionals in every region we cover, each vetted to protect buyers at every stage of the purchase.'
		),
		heroMarkers:
			input?.heroMarkers?.filter(Boolean)?.length
				? input.heroMarkers.filter((marker): marker is string => Boolean(marker?.trim()))
				: ['Independently verified', 'No referral pressure', 'Your choice'],
		whyHeading: s(input?.whyHeading, 'Why we work with partners'),
		whyBody: s(
			input?.whyBody,
			'Buying abroad means trusting people you have never met with decisions that matter. We keep a deliberately small network of independent professionals, each chosen for their record with international buyers, not for what they pay us. We hold no referral fees that could sway our advice. When you are ready, we make a personal introduction. Who you work with, and whether to proceed, stays entirely your decision.'
		),
		whyAttributes:
			input?.whyAttributes?.filter(Boolean)?.length
				? input.whyAttributes.filter((attr): attr is string => Boolean(attr?.trim()))
				: ['Independent', 'Vetted', 'English-speaking', 'No hidden incentives'],
		becomeHeading: s(input?.becomeHeading, 'Are you a professional in this space?'),
		becomeBody: s(
			input?.becomeBody,
			'We work with a small number of vetted legal, tax, financial and property specialists. If you would like to be considered, we would be glad to hear from you.'
		),
		becomeCta: s(input?.becomeCta, 'Apply to partner with us'),
		becomeSupport: s(
			input?.becomeSupport,
			'Inbound partnership enquiries only.\nAverage response within five working days.'
		),
		seo: input?.seo ?? null
	};
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export type AboutTeamMemberInput = {
	name?: string | null;
	role?: string | null;
	bio?: string | null;
	image?: MediaAssetInput | null;
};

export type AboutPlaceInput = {
	name?: string | null;
	region?: string | null;
	heroSlug?: string | null;
	alt?: string | null;
	href?: string | null;
};

export type AboutPageInput = {
	heroTitle?: string | null;
	heroLead?: string | null;
	storyHeading?: string | null;
	storyBody?: unknown[] | null;
	storyQuote?: string | null;
	networkHeading?: string | null;
	networkBody?: string | null;
	networkChips?: string[] | null;
	networkCta?: string | null;
	placesHeading?: string | null;
	placesBody?: string | null;
	places?: AboutPlaceInput[] | null;
	teamHeading?: string | null;
	teamMembers?: AboutTeamMemberInput[] | null;
	teamContactFlag?: string | null;
	closingHeading?: string | null;
	closingBody?: string | null;
	closingPrimaryCta?: string | null;
	closingPrimaryRoute?: string | null;
	closingSecondaryCta?: string | null;
	closingSecondaryRoute?: string | null;
	reviewsHeading?: string | null;
	seo?: SeoInput;
};

export type AboutContent = {
	heroTitle: string;
	heroLead: string;
	storyHeading: string;
	storyBody: unknown[] | null;
	storyQuote: string;
	networkHeading: string;
	networkBody: string;
	networkChips: string[];
	networkCta: string;
	placesHeading: string;
	placesBody: string;
	places: AboutPlaceInput[] | null;
	teamHeading: string;
	teamMembers: AboutTeamMemberInput[] | null;
	teamContactFlag: string;
	closingHeading: string;
	closingBody: string;
	closingPrimaryCta: string;
	closingPrimaryRoute: string;
	closingSecondaryCta: string;
	closingSecondaryRoute: string;
	reviewsHeading: string;
	seo: SeoInput;
};

export function resolveAboutContent(input: AboutPageInput | null): AboutContent {
	return {
		heroTitle: s(input?.heroTitle, 'Built around people, not just listings'),
		heroLead: s(
			input?.heroLead,
			'Specialists in golf property across every region we cover, here to make buying abroad simpler, safer and a lot less daunting.'
		),
		storyHeading: s(input?.storyHeading, 'Our story'),
		storyBody: input?.storyBody ?? null,
		storyQuote: s(
			input?.storyQuote,
			'So we built something different: not just a place to find golf property, but a way of buying that puts the right people around you and supports your decision, rather than pushing a sale.'
		),
		networkHeading: s(input?.networkHeading, 'The right people around you'),
		networkBody: s(
			input?.networkBody,
			'We work with a trusted group of professionals across the whole buying process, and people on the ground in every market we cover. You are free to use your own; but if you would like, we can introduce you to people we know and trust. The right person at the right stage takes a huge amount of stress out of buying abroad, and in our experience that is exactly the part most people overlook.'
		),
		networkChips:
			input?.networkChips?.length
				? input.networkChips
				: ['Lawyers', 'Tax advisers', 'Mortgage brokers', 'On-the-ground specialists'],
		networkCta: s(input?.networkCta, 'See our trusted partners'),
		placesHeading: s(input?.placesHeading, 'Why golf, and why these places'),
		placesBody: s(
			input?.placesBody,
			'Golf is at the heart of what we do. Every location we cover is a genuine golfing destination: Marbella, Sotogrande, the Algarve and beyond, places where world-class courses, the climate and the lifestyle have built established, sought-after property markets around the game. If golf is part of why you are buying abroad, these are the places that deliver it.'
		),
		// The tile href and the two closing CTAs are the only paths an editor types by hand
		// on this page, so they are the only ones that can arrive campaign-tagged. See
		// `$lib/sanity/href` for why that must not reach a visitor's address bar.
		places: input?.places?.length
			? input.places.map((place) => ({
					...place,
					href: place.href ? withoutCampaignParams(place.href) : place.href
				}))
			: null,
		teamHeading: s(input?.teamHeading, 'Who we are'),
		teamMembers: input?.teamMembers?.length ? input.teamMembers : null,
		teamContactFlag: s(input?.teamContactFlag, 'Your first point of contact'),
		closingHeading: s(input?.closingHeading, 'Talk to us'),
		closingBody: s(
			input?.closingBody,
			'No pressure and no obligation. Whether you are ready to view or just starting to think about it, we are happy to help.'
		),
		closingPrimaryCta: s(input?.closingPrimaryCta, 'Get in touch'),
		closingPrimaryRoute: withoutCampaignParams(s(input?.closingPrimaryRoute, '/contact')),
		closingSecondaryCta: s(input?.closingSecondaryCta, 'Browse properties'),
		closingSecondaryRoute: withoutCampaignParams(
			s(input?.closingSecondaryRoute, '/front-line-collection')
		),
		reviewsHeading: s(input?.reviewsHeading, 'What our buyers say'),
		seo: input?.seo ?? null
	};
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export type ContactPageInput = {
	heroTitle?: string | null;
	heroLead?: string | null;
	contactName?: string | null;
	contactRole?: string | null;
	contactFlag?: string | null;
	directHeading?: string | null;
	whatsappCta?: string | null;
	phoneLabel?: string | null;
	reassuranceNote?: string | null;
	nextStepsHeading?: string | null;
	nextSteps?: string[] | null;
	formHeading?: string | null;
	formIntro?: string | null;
	partnerFormHeading?: string | null;
	partnersHeading?: string | null;
	partnersSubhead?: string | null;
	partnersCta?: string | null;
	partnersCtaSupport?: string | null;
	seo?: SeoInput;
};

export type ContactContent = {
	heroTitle: string;
	heroLead: string;
	contactName: string;
	contactFirstName: string;
	contactInitials: string;
	contactRole: string;
	contactFlag: string;
	directHeading: string;
	whatsappCta: string;
	phoneLabel: string;
	reassuranceNote: string;
	nextStepsHeading: string;
	nextSteps: string[];
	formHeading: string;
	formIntro: string;
	partnerFormHeading: string;
	partnersHeading: string;
	partnersSubhead: string;
	partnersCta: string;
	partnersCtaSupport: string;
	seo: SeoInput;
};

function initials(name: string): string {
	return name
		.split(/\s+/)
		.map((w) => w[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}

export function resolveContactContent(input: ContactPageInput | null): ContactContent {
	const contactName = s(input?.contactName, 'James Pryor');
	const firstName = contactName.split(' ')[0];

	return {
		heroTitle: s(input?.heroTitle, "Tell us what you're looking for"),
		heroLead: s(
			input?.heroLead,
			'Whether you are ready to view or just starting to picture it, we are here to help you buy golf property wherever we operate. Tell us a little about what you have in mind and the right person will be in touch.'
		),
		contactName,
		contactFirstName: firstName,
		contactInitials: initials(contactName),
		contactRole: s(
			input?.contactRole,
			'James leads the day to day and is the person you will speak to when you enquire.'
		),
		contactFlag: s(input?.contactFlag, 'Your first point of contact'),
		directHeading: s(input?.directHeading, 'Or reach us directly'),
		whatsappCta: s(input?.whatsappCta, 'Message us on WhatsApp'),
		phoneLabel: s(input?.phoneLabel, 'Call or text'),
		reassuranceNote: s(
			input?.reassuranceNote,
			'Prefer to put it in writing? Send the enquiry and it comes straight to us.'
		),
		nextStepsHeading: s(input?.nextStepsHeading, 'What happens next'),
		nextSteps:
			input?.nextSteps?.length
				? input.nextSteps
				: [
						'We reply within one working day, usually sooner.',
						'We ask a few questions to understand what you are after: the area, the budget, the timing.',
						'No pressure and no obligation. Your details stay with us and never go to a sales list.'
					],
		formHeading: s(input?.formHeading, 'Send an enquiry'),
		formIntro: s(input?.formIntro, 'A few details and {name} will take it from there.').replace(
			'{name}',
			firstName
		),
		partnerFormHeading: s(input?.partnerFormHeading, 'Request an introduction'),
		partnersHeading: s(input?.partnersHeading, 'An introduction to the right people'),
		partnersSubhead: s(
			input?.partnersSubhead,
			'Lawyers, tax advisers, mortgage brokers and people on the ground. Use your own, or let us introduce you to a network we know and trust.'
		),
		partnersCta: s(input?.partnersCta, 'View our partners'),
		partnersCtaSupport: s(
			input?.partnersCtaSupport,
			'Tell us what you need when you enquire and we will connect you with the right specialist.'
		),
		seo: input?.seo ?? null
	};
}
