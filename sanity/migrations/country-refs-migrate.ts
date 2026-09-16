#!/usr/bin/env node
/**
 * Move market tagging from frozen strings onto references, and seed the two new
 * ordering fields.
 *
 * A country used to exist twice: as a `locationTaxonomy` document and as a string in
 * `COUNTRY_OPTIONS`. `partner.countries` and `guide.country` stored the string, so adding
 * a market meant a code change and two deploys. Both fields are now references to the
 * country document, and `COUNTRY_OPTIONS` is gone.
 *
 * What this does, all of it idempotent and safe to re-run:
 *
 *   1. `partner.countries`  string[] → reference[]   (keyed, order preserved)
 *   2. `guide.country`      string   → reference
 *   3. `partner.coverage`   unset where it only restates those countries. It is now a
 *      refinement field ("Costa del Sol"), and the card renders country names from the
 *      references — so a leftover "Spain & Portugal" would print the markets twice. Only
 *      cleared when nothing but country names and joining words remain; anything with
 *      real regional detail is left exactly as the editor wrote it.
 *   4. `locationTaxonomy.displayOrder` on countries — the site's one canonical market
 *      order, seeded in launch order.
 *   5. `partnerCategory.shelfPriority` — the order the listing enquiry shelf reaches for
 *      disciplines. Financing leads here, where a buyer is costing a specific property;
 *      the Partners page keeps its own `order` (Legal & Tax leads there).
 *
 * Both seeds are defaults for the markets and categories that exist today. Editors
 * re-order them in Studio afterwards and re-running will not overwrite a value that is
 * already set.
 *
 * Countries are resolved by `slug.current`, never by building an ID: Spain and Portugal
 * were seeded as `places-country-<slug>`, but UAE and Montenegro were created in Studio
 * and carry random UUIDs.
 *
 * Drafts are included — an in-progress edit must not be left on the old shape.
 *
 * DEPLOY ORDER. The web queries read the reference and fall back to the legacy string, so
 * this is safe to run before or after the web deploy. Studio, however, will flag
 * unmigrated documents as invalid once the new schema ships, so run it promptly.
 *
 * Usage:
 *   pnpm --filter sanity migrate:country-refs -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:country-refs -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

/**
 * Seed order for the markets live today, in launch order. Anything not listed keeps no
 * `displayOrder` and sorts to the end alphabetically, which is the correct behaviour for
 * a market added after this ran.
 */
const MARKET_ORDER: Record<string, number> = {
	spain: 0,
	portugal: 1,
	uae: 2,
	montenegro: 3
};

/**
 * Seed order for the enquiry shelf. Mortgage first (can this purchase happen at all),
 * then Legal & Tax (a lawyer is instructed before the reservation deposit, and it is the
 * trust anchor of the brand), then Currency. Relocation ranks fourth because it is the
 * dominant motive in the Gulf and is the discipline that fills a slot there.
 */
const SHELF_PRIORITY: Record<string, number> = {
	mortgage: 0,
	'legal-tax': 1,
	'currency-exchange': 2,
	'relocation-partner': 3,
	'wealth-management': 4,
	'rental-investment': 5,
	'project-management': 6,
	insurance: 7,
	'holiday-rentals': 8
};

/** Joining words a coverage label uses between country names; not regional detail. */
const COVERAGE_FILLER = /\b(and|&|plus|only|across|in|the|uae|united arab emirates)\b/gi;

type PartnerDoc = {
	_id: string;
	name?: string | null;
	slug?: string | null;
	countries?: unknown;
	coverage?: string | null;
};

type GuideDoc = {
	_id: string;
	title?: string | null;
	country?: unknown;
};

type CountryDoc = { _id: string; slug?: string | null; name?: string | null };

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

function createMigrationClient(): SanityClient {
	if (!TOKEN) {
		throw new Error('Missing Sanity token. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}
	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false
	});
}

/** A value that is already a reference object rather than a legacy slug string. */
function isReference(value: unknown): value is { _ref: string } {
	return typeof value === 'object' && value !== null && '_ref' in value;
}

function reference(id: string, key: string) {
	return { _type: 'reference' as const, _ref: id, _key: key };
}

/**
 * Whether a coverage label says nothing the country references do not already say.
 * "Spain & Portugal" → true (drop it). "Costa del Sol" → false (keep it).
 */
function coverageIsRedundant(coverage: string, countryNames: string[]): boolean {
	let rest = coverage.toLowerCase();
	for (const name of countryNames) {
		rest = rest.split(name.toLowerCase()).join(' ');
	}
	rest = rest.replace(COVERAGE_FILLER, ' ').replace(/[^a-z]/g, '');
	return rest.length === 0;
}

async function main() {
	const client = createMigrationClient();

	const countries = await client.fetch<CountryDoc[]>(
		`*[_type == "locationTaxonomy" && type == "country" && !(_id in path("drafts.**"))]{
			_id, name, "slug": slug.current
		}`
	);
	const idBySlug = new Map<string, string>();
	const nameBySlug = new Map<string, string>();
	for (const country of countries) {
		if (!country.slug) continue;
		idBySlug.set(country.slug, country._id);
		nameBySlug.set(country.slug, country.name ?? country.slug);
	}

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Countries found: ${[...idBySlug.keys()].sort().join(', ') || '(none)'}\n`);

	if (idBySlug.size === 0) {
		throw new Error('No country documents found — refusing to migrate against an empty taxonomy.');
	}

	const transaction = client.transaction();
	let writes = 0;
	const unresolved: string[] = [];

	// 1 + 3. Partners: countries → references, and redundant coverage cleared.
	const partners = await client.fetch<PartnerDoc[]>(
		`*[_type == "partner"]{ _id, name, "slug": slug.current, countries, coverage }`
	);

	console.log('Partners');
	for (const partner of partners) {
		const raw = Array.isArray(partner.countries) ? partner.countries : [];
		const legacy = raw.filter((entry): entry is string => typeof entry === 'string');
		const label = partner.slug ?? partner._id;

		const patch: Record<string, unknown> = {};
		const unset: string[] = [];

		// Already-migrated documents keep their references untouched.
		const countrySlugs = legacy.length > 0 ? legacy : [];
		if (countrySlugs.length > 0) {
			const refs = [];
			for (const slug of countrySlugs) {
				const id = idBySlug.get(slug);
				if (!id) {
					unresolved.push(`partner ${label} → unknown country "${slug}"`);
					continue;
				}
				refs.push(reference(id, `country-${slug}`));
			}
			if (refs.length !== countrySlugs.length) {
				console.log(`  ${label}: SKIPPED — ${countrySlugs.length - refs.length} unknown country`);
				continue;
			}
			patch.countries = refs;
		}

		// Resolve the names this partner's card will now print, to judge its coverage label.
		const resolvedSlugs =
			countrySlugs.length > 0
				? countrySlugs
				: raw.filter(isReference).flatMap((ref) => {
						const found = [...idBySlug.entries()].find(([, id]) => id === ref._ref);
						return found ? [found[0]] : [];
					});
		const names = resolvedSlugs.map((slug) => nameBySlug.get(slug) ?? slug);

		const coverage = partner.coverage?.trim();
		if (coverage && names.length > 0 && coverageIsRedundant(coverage, names)) {
			unset.push('coverage');
		}

		if (Object.keys(patch).length === 0 && unset.length === 0) {
			console.log(`  ${label}: already current`);
			continue;
		}

		const parts = [];
		if (patch.countries) parts.push(`countries → [${resolvedSlugs.join(', ')}]`);
		if (unset.length > 0) parts.push(`coverage "${coverage}" cleared (restates the countries)`);
		console.log(`  ${label}: ${parts.join('; ')}`);

		if (!dryRun) {
			let p = client.patch(partner._id);
			if (Object.keys(patch).length > 0) p = p.set(patch);
			if (unset.length > 0) p = p.unset(unset);
			transaction.patch(p);
		}
		writes += 1;
	}

	// 2. Guides: country → reference.
	const guides = await client.fetch<GuideDoc[]>(`*[_type == "guide"]{ _id, title, country }`);
	console.log('\nGuides');
	for (const guide of guides) {
		const label = guide.title ?? guide._id;
		if (typeof guide.country !== 'string') {
			console.log(`  ${label}: already current`);
			continue;
		}
		const id = idBySlug.get(guide.country);
		if (!id) {
			unresolved.push(`guide ${label} → unknown country "${guide.country}"`);
			console.log(`  ${label}: SKIPPED — unknown country "${guide.country}"`);
			continue;
		}
		console.log(`  ${label}: country → ${guide.country}`);
		if (!dryRun) {
			transaction.patch(client.patch(guide._id).set({ country: { _type: 'reference', _ref: id } }));
		}
		writes += 1;
	}

	// 4. Market order on countries.
	console.log('\nMarket order');
	const countriesWithOrder = await client.fetch<Array<CountryDoc & { displayOrder?: number | null }>>(
		`*[_type == "locationTaxonomy" && type == "country"]{ _id, name, "slug": slug.current, displayOrder }`
	);
	for (const country of countriesWithOrder) {
		if (!country.slug) continue;
		const seed = MARKET_ORDER[country.slug];
		if (seed === undefined) {
			console.log(`  ${country.slug}: no seed value (sorts last, alphabetically)`);
			continue;
		}
		if (typeof country.displayOrder === 'number') {
			console.log(`  ${country.slug}: already set (${country.displayOrder})`);
			continue;
		}
		console.log(`  ${country.slug}: displayOrder → ${seed}`);
		if (!dryRun) {
			transaction.patch(client.patch(country._id).set({ displayOrder: seed }));
		}
		writes += 1;
	}

	// 5. Shelf priority on partner categories.
	console.log('\nEnquiry shelf priority');
	const categories = await client.fetch<
		Array<{ _id: string; slug?: string | null; shelfPriority?: number | null }>
	>(`*[_type == "partnerCategory"]{ _id, "slug": slug.current, shelfPriority }`);
	for (const category of categories) {
		if (!category.slug) continue;
		const seed = SHELF_PRIORITY[category.slug];
		if (seed === undefined) {
			console.log(`  ${category.slug}: no seed value (considered last)`);
			continue;
		}
		if (typeof category.shelfPriority === 'number') {
			console.log(`  ${category.slug}: already set (${category.shelfPriority})`);
			continue;
		}
		console.log(`  ${category.slug}: shelfPriority → ${seed}`);
		if (!dryRun) {
			transaction.patch(client.patch(category._id).set({ shelfPriority: seed }));
		}
		writes += 1;
	}

	if (unresolved.length > 0) {
		console.log('\nUnresolved (left untouched, fix in Studio):');
		for (const line of unresolved) console.log(`  ${line}`);
	}

	if (dryRun) {
		console.log(`\nDry run: ${writes} document(s) would be patched. Nothing written.`);
		return;
	}

	if (writes === 0) {
		console.log('\nNothing to do.');
		return;
	}

	await transaction.commit();
	console.log(`\nPatched ${writes} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
