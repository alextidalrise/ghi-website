#!/usr/bin/env tsx
/**
 * Seed the five editorial page documents / fields with the same defaults the
 * frontend code uses when a CMS field is empty. After running, editors see the
 * live copy in the Studio and can tweak it directly instead of starting from blank.
 *
 * Covers:
 *   • siteSettings  → homepageContent, homepageSeo, frontlineContent, frontlineSeo
 *   • guidesHubPage → all content + seo fields
 *   • aboutPage     → all content + seo fields
 *   • contactPage   → all content + seo fields
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/seed-page-content.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/seed-page-content.ts --dataset development --dry-run
 *   pnpm --filter sanity exec tsx migrations/seed-page-content.ts --dataset production --allow-production
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allowProduction = args.includes('--allow-production');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	(datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ??
	process.env.SANITY_STUDIO_DATASET ??
	'development';

if (dataset === 'production' && !allowProduction) {
	console.error(
		'Refusing to run against the production dataset. Re-run with --allow-production if that is intended.'
	);
	process.exit(1);
}

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config/sanity/config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

async function draftExists(client: SanityClient, id: string): Promise<boolean> {
	return client.fetch<boolean>(`defined(*[_id == $id][0]._id)`, { id: `drafts.${id}` });
}

async function patchBoth(
	client: SanityClient,
	id: string,
	fields: Record<string, unknown>
) {
	await client.patch(id).set(fields).commit();
	if (await draftExists(client, id)) {
		await client.patch(`drafts.${id}`).set(fields).commit();
	}
}

// ---------------------------------------------------------------------------
// Default content — mirrors web/src/lib/sanity/transforms/pageContent.ts
// ---------------------------------------------------------------------------

const homepageContent = {
	_type: 'homepageContent',
	heroHeadline: 'Homes beside\n*the fairway*',
	buyerIntroHeading: 'Everything to know before you buy',
	buyerIntroDeck:
		'The process, the costs, the tax and the mortgage — set out plainly for non-resident buyers in Spain and Portugal.',
	buyerIntroCta: "Read the buyer's guides",
	featuredHeading: 'Featured properties',
	featuredSummary: 'Hand-picked listings across Spain and Portugal.',
	frontlineHeading: 'Frontline Golf Properties',
	frontlineSummary: 'Homes directly on the fairway, in Spain and Portugal.',
	destinationsHeading: 'Explore by country',
	partnersHeading: 'Trusted Partners',
	partnersSubhead: 'Legal, financial and local expertise across Spain and Portugal.',
	partnersCta: 'Request introduction',
	partnersCtaSupport:
		"Tell us what you need and we'll connect you with the right specialist.",
	reviewsHeading: 'From keys-in-hand buyers',
	reviewsDeck:
		"Real reviews from people who've bought golf property with us in Spain and Portugal."
};

const homepageSeo = {
	_type: 'seoFields',
	seoTitle: 'Golf Homes International | Golf property in Spain & Portugal',
	metaDescription:
		'Curated golf property for sale in Spain and Portugal. Frontline fairway homes, buyer guides, and trusted local partners.',
	openGraphTitle: 'Golf Homes International | Golf property in Spain & Portugal',
	openGraphDescription:
		'Curated golf property for sale in Spain and Portugal. Frontline fairway homes, buyer guides, and trusted local partners.',
	noindex: false
};

const frontlineContent = {
	_type: 'frontlineContent',
	ctaLabel: 'Browse the collection',
	resultsHeading: 'Frontline golf homes'
};

const frontlineSeo = {
	_type: 'seoFields',
	seoTitle: 'Front Line Collection | Golf Homes International',
	metaDescription:
		'Homes directly on the fairway in Spain and Portugal — the Front Line Collection from Golf Homes International.',
	openGraphTitle: 'Front Line Collection | Golf Homes International',
	openGraphDescription:
		'Homes directly on the fairway in Spain and Portugal — the Front Line Collection from Golf Homes International.',
	noindex: false
};

const guidesHubPage = {
	_type: 'guidesHubPage',
	heroTitle: 'Guides',
	heroLead:
		'Considered, current guidance on buying and owning a home near the finest golf in Spain and Portugal.',
	sectionHeading: 'Where to start',
	categories: [
		{
			_key: 'buying',
			key: 'buying',
			label: 'Buying guides',
			blurb:
				'How a purchase works country by country: the legal steps, the taxes and fees, financing, and the order it all happens in.'
		},
		{
			_key: 'location',
			key: 'location',
			label: 'Location guides',
			blurb:
				'Where to buy and why, area by area: the character of each place, who it suits, and what living there is like.'
		},
		{
			_key: 'golf',
			key: 'golf',
			label: 'Golf guides',
			blurb: 'The courses behind the homes: membership, access, and what playing there involves.'
		}
	],
	emptyStateMessage: 'The first guides are being written. Check back shortly.',
	seo: {
		_type: 'seoFields',
		seoTitle: 'Guides | Golf Homes International',
		metaDescription:
			'Buyer guides for golf property in Spain and Portugal — legal steps, taxes, financing, locations and courses.',
		openGraphTitle: 'Guides | Golf Homes International',
		openGraphDescription:
			'Buyer guides for golf property in Spain and Portugal — legal steps, taxes, financing, locations and courses.',
		noindex: false
	}
};

const aboutPage = {
	_type: 'aboutPage',
	heroTitle: 'Built around people, not just listings',
	heroLead:
		'Specialists in golf property across Spain and Portugal, here to make buying abroad simpler, safer and a lot less daunting.',
	storyHeading: 'Our story',
	storyBody: [
		{
			_key: 'p1',
			_type: 'block',
			style: 'normal',
			children: [
				{
					_key: 'c1',
					_type: 'span',
					text: 'Golf Homes International started with two things we care about more than most: golf and property. Between us we have spent around six years living in Spain and Portugal, playing the courses and getting to know the communities.'
				}
			],
			markDefs: []
		},
		{
			_key: 'p2',
			_type: 'block',
			style: 'normal',
			children: [
				{
					_key: 'c2',
					_type: 'span',
					text: 'Buying a home abroad is an emotional decision as much as a financial one, and for most people it is something they do only once or twice in a lifetime. What we kept seeing was how little care goes into the parts that matter most. Having the right professional beside you at every stage is too often left to chance.'
				}
			],
			markDefs: []
		}
	],
	storyQuote:
		'So we built something different: not just a place to find golf property, but a way of buying that puts the right people around you and supports your decision, rather than pushing a sale.',
	networkHeading: 'The right people around you',
	networkBody:
		'We work with a trusted group of professionals across the whole buying process, and people on the ground in Spain and Portugal. You are free to use your own; but if you would like, we can introduce you to people we know and trust. The right person at the right stage takes a huge amount of stress out of buying abroad, and in our experience that is exactly the part most people overlook.',
	networkChips: ['Lawyers', 'Tax advisers', 'Mortgage brokers', 'On-the-ground specialists'],
	networkCta: 'See our trusted partners',
	placesHeading: 'Why golf, and why these places',
	placesBody:
		'Golf is at the heart of what we do. Every location we cover is a genuine golfing destination: Marbella, Sotogrande, the Algarve and beyond, places where world-class courses, the climate and the lifestyle have built established, sought-after property markets around the game. If golf is part of why you are buying abroad, these are the places that deliver it.',
	places: [
		{
			_key: 'marbella',
			name: 'Marbella',
			region: 'Costa del Sol, Spain',
			heroSlug: 'marbella',
			alt: 'Golf fairways running down to the Mediterranean above Marbella on the Costa del Sol',
			href: '/spain/marbella'
		},
		{
			_key: 'sotogrande',
			name: 'Sotogrande',
			region: 'Cádiz, Spain',
			heroSlug: 'sotogrande',
			alt: 'Manicured championship course and low villas in the resort of Sotogrande',
			href: '/spain/sotogrande'
		},
		{
			_key: 'algarve',
			name: 'The Algarve',
			region: 'Southern Portugal',
			heroSlug: 'quinta-do-lago',
			alt: 'Pine-lined Algarve golf course above the Atlantic coastline in southern Portugal',
			href: '/portugal'
		}
	],
	teamHeading: 'Who we are',
	teamMembers: [
		{
			_key: 'james',
			name: 'James Pryor',
			role: 'James leads the day to day and is the person you will speak to when you enquire.',
			bio: 'Years spent living and playing across the Costa del Sol, with the local knowledge that only comes from being on the course and in the communities week after week.'
		},
		{
			_key: 'jack',
			name: 'Jack Ballantine',
			role: 'Jack focuses on strategy and growth.',
			bio: 'A career in international real estate, from city new-builds to resort developments across southern Europe, brought to bear on where the market is heading.'
		},
		{
			_key: 'alex',
			name: 'Alex Chapman',
			role: 'Alex built and runs the platform and technology behind the business.',
			bio: 'Builds the platform end to end, from the listings you browse to the systems that keep the portfolio curated and honest.'
		}
	],
	teamContactFlag: 'Your first point of contact',
	closingHeading: 'Talk to us',
	closingBody:
		'No pressure and no obligation. Whether you are ready to view or just starting to think about it, we are happy to help.',
	closingPrimaryCta: 'Get in touch',
	closingPrimaryRoute: '/contact',
	closingSecondaryCta: 'Browse properties',
	closingSecondaryRoute: '/front-line-collection',
	reviewsHeading: 'What our buyers say',
	seo: {
		_type: 'seoFields',
		seoTitle: 'About | Golf Homes International',
		metaDescription:
			'Who we are: specialists in golf property across Spain and Portugal, with trusted partners at every stage of buying abroad.',
		openGraphTitle: 'About | Golf Homes International',
		openGraphDescription:
			'Who we are: specialists in golf property across Spain and Portugal, with trusted partners at every stage of buying abroad.',
		noindex: false
	}
};

const contactPage = {
	_type: 'contactPage',
	heroTitle: "Tell us what you're looking for",
	heroLead:
		'Whether you are ready to view or just starting to picture it, we are here to help you buy golf property in Spain and Portugal. Tell us a little about what you have in mind and the right person will be in touch.',
	contactName: 'James Pryor',
	contactRole:
		'James leads the day to day and is the person you will speak to when you enquire.',
	contactFlag: 'Your first point of contact',
	directHeading: 'Or reach us directly',
	whatsappCta: 'Message us on WhatsApp',
	phoneLabel: 'Call or text',
	reassuranceNote:
		'Prefer to put it in writing? Send the enquiry and it comes straight to us.',
	nextStepsHeading: 'What happens next',
	nextSteps: [
		'We reply within one working day, usually sooner.',
		'We ask a few questions to understand what you are after: the area, the budget, the timing.',
		'No pressure and no obligation. Your details stay with us and never go to a sales list.'
	],
	formHeading: 'Send an enquiry',
	formIntro: 'A few details and {name} will take it from there.',
	partnerFormHeading: 'Request an introduction',
	partnersHeading: 'An introduction to the right people',
	partnersSubhead:
		'Lawyers, tax advisers, mortgage brokers and people on the ground. Use your own, or let us introduce you to a network we know and trust.',
	partnersCta: 'View our partners',
	partnersCtaSupport:
		'Tell us what you need when you enquire and we will connect you with the right specialist.',
	seo: {
		_type: 'seoFields',
		seoTitle: 'Contact | Golf Homes International',
		metaDescription:
			'Speak to the Golf Homes International team about golf property in Spain and Portugal. Message us on WhatsApp, call, or send an enquiry and we will reply within a working day.',
		openGraphTitle: 'Contact | Golf Homes International',
		openGraphDescription:
			'Speak to the Golf Homes International team about golf property in Spain and Portugal. Message us on WhatsApp, call, or send an enquiry and we will reply within a working day.',
		noindex: false
	}
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function main() {
	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Either export SANITY_API_TOKEN=… or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false
	});

	console.log(`Seed page content into ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}\n`);

	// 1. siteSettings — patch existing document
	console.log('siteSettings:');
	console.log('  homepageContent  — hero, sections, partners, reviews');
	console.log('  homepageSeo      — title, description');
	console.log('  frontlineContent — CTA, results heading');
	console.log('  frontlineSeo     — title, description');
	if (!dryRun) {
		await client.createIfNotExists({ _id: 'siteSettings', _type: 'siteSettings' });
		await patchBoth(client, 'siteSettings', {
			homepageContent,
			homepageSeo,
			frontlineContent,
			frontlineSeo
		});
		console.log('  ✓ patched\n');
	}

	// 2. guidesHubPage — singleton
	console.log('guidesHubPage:');
	console.log(`  hero, ${guidesHubPage.categories.length} categories, empty state, SEO`);
	if (!dryRun) {
		await client.createIfNotExists({ _id: 'guidesHubPage', ...guidesHubPage });
		await patchBoth(client, 'guidesHubPage', guidesHubPage);
		console.log('  ✓ seeded\n');
	}

	// 3. aboutPage — singleton
	console.log('aboutPage:');
	console.log(`  hero, story, network, places, ${aboutPage.teamMembers.length} team members, closing, SEO`);
	if (!dryRun) {
		await client.createIfNotExists({ _id: 'aboutPage', ...aboutPage });
		await patchBoth(client, 'aboutPage', aboutPage);
		console.log('  ✓ seeded\n');
	}

	// 4. contactPage — singleton
	console.log('contactPage:');
	console.log(`  hero, lead contact, direct channels, ${contactPage.nextSteps.length} next steps, form, partners, SEO`);
	if (!dryRun) {
		await client.createIfNotExists({ _id: 'contactPage', ...contactPage });
		await patchBoth(client, 'contactPage', contactPage);
		console.log('  ✓ seeded\n');
	}

	if (dryRun) {
		console.log('\nDry run complete — no changes written.');
	} else {
		console.log('Done — all page content seeded.');
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
