#!/usr/bin/env tsx
/**
 * Seed `siteSettings.footer` with the footer the site shipped with before it moved into
 * Sanity. It reproduces the previous footer one-to-one:
 *
 *   • Brand statement + "Considering a move?" → "Make an enquiry" CTA
 *   • One index column per country (Spain, Portugal, …), each listing its locations and
 *     ending in an "All <Country> →" link. Geography is linked by REFERENCE, so the URLs
 *     track the slugs — the same set the footer used to generate from the taxonomy, now
 *     captured as editable content.
 *   • An "Explore" column (Front Line Collection · Buying Guide · About Us · Contact)
 *   • Legal links (Privacy · Terms) and the Instagram social link
 *
 * Country/location links use references; the editorial, legal and CTA links use internal
 * paths (they don't map to a single document). Editors can reorder or swap anything after.
 *
 * Only `footer` is touched; every other siteSettings field is left untouched. Idempotent:
 * re-running overwrites `footer` with the same content (stable array keys, so no churn).
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/seed-footer.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/seed-footer.ts --dataset development --dry-run
 *   pnpm --filter sanity exec tsx migrations/seed-footer.ts --dataset development --delete
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
const doDelete = args.includes('--delete');
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

const SITE_SETTINGS_ID = 'siteSettings';
const DRAFT_ID = `drafts.${SITE_SETTINGS_ID}`;

// Order countries the way the site presented them: the primary market first, then the
// rest alphabetically. Anything not listed falls to the end, alphabetically.
const COUNTRY_ORDER = ['spain', 'portugal'];

type CountryRow = {
	_id: string;
	name: string;
	slug: string;
	locations: Array<{ _id: string; name: string }>;
};

const COUNTRIES_QUERY = `
	*[_type == "locationTaxonomy" && type == "country" && !(_id in path("drafts.**"))]{
		_id,
		name,
		"slug": slug.current,
		"locations": *[
			_type == "locationTaxonomy" && type == "location" && parent._ref == ^._id
			&& !(_id in path("drafts.**"))
		] | order(name asc){ _id, name }
	}
`;

type NavLink = Record<string, unknown> & { _type: 'navLink'; linkType: string };

/** A reference-style navLink to a taxonomy document (URL resolved from its slug). */
function referenceLink(id: string): NavLink {
	return { _type: 'navLink', linkType: 'reference', reference: { _type: 'reference', _ref: id } };
}

/** An internal-path navLink. */
function internalLink(path: string): NavLink {
	return { _type: 'navLink', linkType: 'internal', internalPath: path };
}

type ChildDoc = { _key: string; _type: 'navMenuChild'; label: string; link: NavLink };
type FooterColumnDoc = {
	_key: string;
	_type: 'footerColumn';
	heading: string;
	links: ChildDoc[];
	highlightLink?: ChildDoc;
};

/** A labelled link (navMenuChild) keyed stably so re-runs don't churn array keys. */
function child(key: string, label: string, link: NavLink): ChildDoc {
	return { _key: key, _type: 'navMenuChild', label, link };
}

function buildColumns(countries: CountryRow[]): FooterColumnDoc[] {
	const ordered = [...countries].sort((a, b) => {
		const ia = COUNTRY_ORDER.indexOf(a.slug);
		const ib = COUNTRY_ORDER.indexOf(b.slug);
		if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
		return a.name.localeCompare(b.name);
	});

	const countryColumns = ordered.map((country) => ({
		_key: `country-${country.slug}`,
		_type: 'footerColumn' as const,
		heading: country.name,
		links: country.locations.map((loc) =>
			child(`loc-${loc._id}`, loc.name, referenceLink(loc._id))
		),
		highlightLink: child(`all-${country.slug}`, `All ${country.name}`, referenceLink(country._id))
	}));

	const exploreColumn = {
		_key: 'explore',
		_type: 'footerColumn' as const,
		heading: 'Explore',
		links: [
			child('frontline', 'Front Line Collection', internalLink('/front-line-collection')),
			child('guides', 'Buying Guide', internalLink('/guides')),
			child('about', 'About Us', internalLink('/about')),
			child('contact', 'Contact', internalLink('/contact'))
		]
	};

	return [...countryColumns, exploreColumn];
}

function buildFooter(countries: CountryRow[]) {
	return {
		brandStatement:
			'Curated residential property on and near the finest golf courses of Spain and Portugal.',
		inviteLead: 'Considering a move?',
		inviteCta: child('invite', 'Make an enquiry', internalLink('/contact')),
		columns: buildColumns(countries),
		legalLinks: [
			child('privacy', 'Privacy', internalLink('/privacy')),
			child('terms', 'Terms', internalLink('/terms'))
		],
		socialLinks: [
			{
				_key: 'instagram',
				_type: 'socialLink',
				platform: 'instagram',
				url: 'https://www.instagram.com/golfhomesinternational'
			}
		]
	};
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

/** True when an unpublished draft of the singleton exists. */
async function draftExists(client: SanityClient): Promise<boolean> {
	return client.fetch<boolean>(`defined(*[_id == $id][0]._id)`, { id: DRAFT_ID });
}

async function seed(client: SanityClient, footer: ReturnType<typeof buildFooter>) {
	// Make sure the singleton exists before patching, without disturbing its other fields.
	await client.createIfNotExists({ _id: SITE_SETTINGS_ID, _type: 'siteSettings' });
	await client.patch(SITE_SETTINGS_ID).set({ footer }).commit();
	// The Studio edits the draft, and publishing it would otherwise overwrite the published
	// doc — wiping this field. Mirror it onto the draft when one exists so the footer shows
	// in the Studio and survives the next publish.
	if (await draftExists(client)) {
		await client.patch(DRAFT_ID).set({ footer }).commit();
	}
}

async function unset(client: SanityClient) {
	await client.patch(SITE_SETTINGS_ID).unset(['footer']).commit();
	if (await draftExists(client)) {
		await client.patch(DRAFT_ID).unset(['footer']).commit();
	}
}

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

	const verb = doDelete ? 'Unset footer on' : 'Seed footer into';
	console.log(`${verb} ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	if (doDelete) {
		console.log('  unset: footer');
		if (!dryRun) {
			await unset(client);
			console.log('Done — footer field cleared (site falls back to the built-in footer).');
		} else {
			console.log('Dry run complete — no changes written.');
		}
		return;
	}

	const countries = await client.fetch<CountryRow[]>(COUNTRIES_QUERY);
	const footer = buildFooter(countries);

	for (const column of footer.columns) {
		const count = column.links?.length ?? 0;
		const highlight = 'highlightLink' in column ? column.highlightLink : undefined;
		const tail = highlight ? ` (+ ${highlight.label})` : '';
		console.log(`  ${column.heading}: ${count} link(s)${tail}`);
	}
	console.log(`  [CTA] ${footer.inviteCta.label} → /contact`);
	console.log(`  [legal] ${footer.legalLinks.map((l) => l.label).join(', ')}`);
	console.log(`  [social] ${footer.socialLinks.map((s) => s.platform).join(', ')}`);

	if (dryRun) {
		console.log('Dry run complete — no changes written.');
		return;
	}

	await seed(client, footer);
	console.log('Done — footer seeded.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
