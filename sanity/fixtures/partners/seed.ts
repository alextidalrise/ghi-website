#!/usr/bin/env node
/**
 * Seed the vetted partner network into Sanity: the seven partner categories and the
 * partners that currently live on /partners. This migrates the content that used to be
 * hardcoded in web/src/lib/partners/partners.ts into the CMS so the GHI team can manage
 * partners — and upload each partner's logo — in Studio.
 *
 * Logos are intentionally NOT seeded: upload them per partner in Studio (Partners →
 * Partner → Logo). Until a logo is uploaded the card shows the wordmark placeholder,
 * exactly as before. `referralUrl` is carried through for the team's handoff and is
 * never projected to the website.
 *
 * Re-running upserts every document (createOrReplace), so it is safe to run repeatedly
 * AS LONG AS no logos have been uploaded yet — a re-run would overwrite the logo field
 * back to empty. Once the team has added logos, manage partners in Studio, not here.
 *
 * Requires a write token. Defaults to the `development` dataset (what the web dev server
 * reads — PUBLIC_SANITY_DATASET in web/.env.local).
 *
 * Usage:
 *   pnpm --filter sanity partners:seed            # uses the Sanity CLI auth token
 *   SANITY_API_TOKEN=… pnpm --filter sanity partners:seed
 *   pnpm --filter sanity partners:seed:dry-run
 *   pnpm --filter sanity partners:delete
 */
import { createClient, type IdentifiedSanityDocumentStub } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN = process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const deleteMode = args.includes('--delete');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

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

const categoryId = (slug: string) => `partner-category.${slug}`;
const partnerId = (slug: string) => `partner.${slug}`;

type CategorySeed = {
	slug: string;
	name: string;
	monogram: string;
	role: string;
	partners: Array<{
		slug: string;
		name: string;
		/** Taxonomy country slugs this partner covers — drives the listing enquiry shelf. */
		countries: string[];
		coverage: string;
		description: string;
		referralUrl?: string;
	}>;
};

/** Mirrors the order and copy previously authored in web/src/lib/partners/partners.ts. */
const CATEGORIES: CategorySeed[] = [
	{
		slug: 'legal-tax',
		name: 'Legal & Tax',
		monogram: 'L',
		role: 'Property law, conveyancing and cross-border taxation',
		partners: [
			{
				slug: 'franke-de-la-fuente',
				name: 'Franke de la Fuente',
				countries: ['spain'],
				coverage: 'Spain · Costa del Sol',
				description:
					'A law firm guiding international clients through property purchases, relocation and Spanish taxation. Technical depth paired with clear, accessible advice, delivered by a multilingual team with offices in Marbella, Estepona and Fuengirola.'
			}
		]
	},
	{
		slug: 'wealth-management',
		name: 'Wealth Management',
		monogram: 'W',
		role: 'Cross-border financial planning and retirement',
		partners: [
			{
				slug: 'atlas-bridge-wealth',
				name: 'Atlas Bridge Wealth',
				countries: ['spain', 'portugal'],
				coverage: 'Spain & Portugal',
				description:
					'A boutique, fee-based financial planning firm based in Portugal, advising internationally minded families on pensions, investments, retirement and long-term wealth structuring across multiple jurisdictions.',
				referralUrl: 'https://calendly.com/steve-atlasbridgewealth'
			}
		]
	},
	{
		slug: 'mortgage',
		name: 'Mortgage',
		monogram: 'M',
		role: 'Finance for non-resident and international buyers',
		partners: [
			{
				slug: 'foxes-finance-legal',
				name: 'Foxes Finance & Legal',
				countries: ['spain', 'portugal'],
				coverage: 'Spain · Portugal on referral',
				description:
					'A Spanish mortgage brokerage helping international buyers secure finance for property in Spain, from affordability and lender eligibility through to mortgage offers and the key stages of completion.',
				referralUrl: 'https://foxes.es/get-started/'
			}
		]
	},
	{
		slug: 'currency-exchange',
		name: 'Currency Exchange',
		monogram: 'C',
		role: 'Moving money across borders for a purchase',
		partners: [
			{
				slug: 'fiberpay',
				name: 'Fiberpay',
				countries: ['spain', 'portugal'],
				coverage: 'Spain & Portugal',
				description:
					'Specialist currency transfers for property buyers moving money internationally. Competitive rates and guided, high-value transactions, with a more personal alternative to the high-street banks.',
				referralUrl:
					'https://fiberpay.com/?utm_source=Nueva+Vida&utm_medium=Referral&utm_campaign=Partner'
			}
		]
	},
	{
		slug: 'project-management',
		name: 'Project Management',
		monogram: 'P',
		role: 'Build, renovation and handover oversight',
		partners: [
			{
				slug: 'nueva-vida-group',
				name: 'Nueva Vida Group',
				countries: ['spain', 'portugal'],
				coverage: 'Spain & Portugal',
				description:
					'A full project management service acting as your representative from first concept to final handover. The team coordinates designers, contractors and specialists across design, construction, procurement and delivery.'
			}
		]
	},
	{
		slug: 'rental-investment',
		name: 'Rental & Investment',
		monogram: 'R',
		role: 'Managed buy-to-let and rental portfolios',
		partners: [
			{
				slug: 'olive-grove-partners',
				name: 'Olive Grove Partners',
				countries: ['spain'],
				coverage: 'Marbella & Nueva Andalucía',
				description:
					'A vertically integrated rental investment platform across Marbella and Nueva Andalucía. Owning and managing the whole chain, from acquisition and marketing to operations and exit, for short and long-term lets.'
			}
		]
	},
	{
		slug: 'holiday-rentals',
		name: 'Holiday Rentals',
		monogram: 'H',
		role: 'Short-let management for second homes',
		partners: [
			{
				slug: 'albany-global-property',
				name: 'Albany Global Property',
				countries: ['spain', 'portugal'],
				coverage: 'Spain & Portugal',
				description:
					'A curated collection of holiday homes in sought-after destinations. Standout architecture and rare settings, with a signature service that manages every stay from arrival to departure.'
			}
		]
	}
];

function buildDocuments(): IdentifiedSanityDocumentStub[] {
	const docs: IdentifiedSanityDocumentStub[] = [];
	CATEGORIES.forEach((category, categoryIndex) => {
		docs.push({
			_id: categoryId(category.slug),
			_type: 'partnerCategory',
			name: category.name,
			slug: { _type: 'slug', current: category.slug },
			monogram: category.monogram,
			role: category.role,
			order: categoryIndex
		});
		category.partners.forEach((partner, partnerIndex) => {
			docs.push({
				_id: partnerId(partner.slug),
				_type: 'partner',
				name: partner.name,
				slug: { _type: 'slug', current: partner.slug },
				category: { _type: 'reference', _ref: categoryId(category.slug) },
				countries: partner.countries,
				coverage: partner.coverage,
				description: partner.description,
				order: partnerIndex,
				...(partner.referralUrl ? { referralUrl: partner.referralUrl } : {})
			});
		});
	});
	return docs;
}

function allIds(): string[] {
	const ids: string[] = [];
	CATEGORIES.forEach((category) => {
		ids.push(categoryId(category.slug));
		category.partners.forEach((partner) => ids.push(partnerId(partner.slug)));
	});
	return ids;
}

async function main() {
	console.log(`Partners → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Set SANITY_API_TOKEN=… (write token) or run `pnpm exec sanity login`.'
		);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-05-01',
		token: TOKEN,
		useCdn: false
	});

	if (deleteMode) {
		const ids = allIds();
		console.log(`Deleting ${ids.length} partner documents…`);
		for (const id of ids) {
			if (dryRun) {
				console.log(`  [dry-run] delete ${id}`);
				continue;
			}
			await client.delete(id).catch(() => undefined);
			console.log(`  ✓ deleted ${id}`);
		}
		return;
	}

	const documents = buildDocuments();
	console.log(`Upserting ${documents.length} documents (categories + partners)…`);
	for (const doc of documents) {
		if (dryRun) {
			console.log(`  [dry-run] ${doc._type} ${doc._id}`);
			continue;
		}
		await client.createOrReplace(doc);
		console.log(`  ✓ ${doc._type} ${doc._id}`);
	}

	console.log('\nNext: upload each partner logo in Studio (Partners → Partner → Logo).');
	console.log('View (after `pnpm --filter web dev`): /partners');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
