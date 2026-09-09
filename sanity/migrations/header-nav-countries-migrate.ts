#!/usr/bin/env tsx
/**
 * Fold the top-level country items of `siteSettings.headerNav` under a single "Countries"
 * item, as the three-tier header menu expects:
 *
 *   before:  Spain ▸ locations · Portugal ▸ locations · UAE ▸ locations · Front Line … · About
 *   after:   Countries ▸ [ Spain ▸ locations · Portugal ▸ locations · UAE ▸ locations ] · Front Line … · About
 *
 * A top-level item counts as a country when its link references a country document, or
 * is a hand-typed internal path equal to that country's URL (`/spain`). Each becomes a
 * `navMenuGroup` under "Countries", its link rewritten to the country *reference* so the
 * header can dereference the flag, and its location sub-items carried over untouched.
 * The "Countries" item is inserted where the first country used to sit, so the editorial
 * items keep their order. Anything else on the menu is left alone.
 *
 * Idempotent: a menu that already carries a group-bearing item is reported and skipped.
 *
 * Run order matters. The web app must be deployed with the three-tier header BEFORE this
 * reshapes the published document — the old query would render the new shape as a plain
 * "Countries" dropdown of country links with no locations. `--target draft` reshapes
 * only the Studio draft (used for local preview, and safe to run first); `--backup` and
 * `--restore` exist to put a target back exactly as it was.
 *
 * Usage:
 *   pnpm --filter sanity headernav:countries:dry-run -- --dataset development
 *   pnpm --filter sanity headernav:countries -- --dataset development --target draft --backup /tmp/nav.json
 *   pnpm --filter sanity headernav:countries -- --dataset development            # published + draft
 *   pnpm --filter sanity headernav:countries -- --dataset development --restore /tmp/nav.json
 */
import { createClient, type SanityClient } from '@sanity/client';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const allowProduction = args.includes('--allow-production');
const dataset = flagValue('--dataset') ?? process.env.SANITY_STUDIO_DATASET ?? 'development';
const target = (flagValue('--target') ?? 'both') as 'published' | 'draft' | 'both';
const backupPath = flagValue('--backup');
const restorePath = flagValue('--restore');

if (!['published', 'draft', 'both'].includes(target)) {
	console.error(`Unknown --target "${target}". Use published, draft, or both.`);
	process.exit(1);
}

if (dataset === 'production' && !allowProduction) {
	console.error(
		'Refusing to run against the production dataset. Re-run with --allow-production if that is intended.'
	);
	process.exit(1);
}

const SITE_SETTINGS_ID = 'siteSettings';
const DRAFT_ID = `drafts.${SITE_SETTINGS_ID}`;
const COUNTRIES_KEY = 'countries';
const COUNTRIES_LABEL = 'Countries';

type NavLink = {
	_type: 'navLink';
	linkType?: 'reference' | 'internal' | 'external';
	reference?: { _type: 'reference'; _ref: string };
	internalPath?: string;
	externalUrl?: string;
};

type NavChild = { _key: string; _type: 'navMenuChild'; label: string; link: NavLink };

type NavGroup = {
	_key: string;
	_type: 'navMenuGroup';
	label: string;
	link?: NavLink;
	children?: NavChild[];
};

type NavItem = {
	_key: string;
	_type: 'navMenuItem';
	label: string;
	link?: NavLink;
	children?: (NavChild | NavGroup)[];
};

type Country = { _id: string; slug: string; name: string | null };

function flagValue(flag: string): string | undefined {
	const withEquals = args.find((arg) => arg.startsWith(`${flag}=`));
	if (withEquals) return withEquals.slice(flag.length + 1);
	const index = args.indexOf(flag);
	return index >= 0 ? args[index + 1] : undefined;
}

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

function loadEnvFile(path: string): void {
	if (!existsSync(path)) return;
	for (const line of readFileSync(path, 'utf8').split('\n')) {
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith('#')) continue;
		const separator = trimmed.indexOf('=');
		if (separator <= 0) continue;
		const key = trimmed.slice(0, separator).trim();
		const value = trimmed.slice(separator + 1).trim();
		if (key && process.env[key] === undefined) process.env[key] = value;
	}
}

/** The published country documents: the reference targets for the reshaped groups. */
async function fetchCountries(client: SanityClient): Promise<Country[]> {
	return client.fetch<Country[]>(
		`*[_type == "locationTaxonomy" && type == "country" && !(_id in path("drafts.**")) && defined(slug.current)]{ _id, "slug": slug.current, name }`
	);
}

/** The country a top-level item stands for, if any. */
function countryOf(item: NavItem, countries: Country[]): Country | undefined {
	const link = item.link;
	if (!link?.linkType) return undefined;
	if (link.linkType === 'reference') {
		const ref = link.reference?._ref?.replace(/^drafts\./, '');
		return countries.find((c) => c._id === ref);
	}
	if (link.linkType === 'internal') {
		const path = link.internalPath?.replace(/\/+$/, '');
		return countries.find((c) => `/${c.slug}` === path);
	}
	return undefined;
}

function alreadyMigrated(nav: NavItem[]): boolean {
	return nav.some((item) => (item.children ?? []).some((child) => child._type === 'navMenuGroup'));
}

/** Reshape one menu; returns null when there is nothing to do. */
function reshape(nav: NavItem[], countries: Country[]): NavItem[] | null {
	if (alreadyMigrated(nav)) return null;

	const groups: NavGroup[] = [];
	let insertAt = -1;
	const rest: NavItem[] = [];

	nav.forEach((item, index) => {
		const country = countryOf(item, countries);
		if (!country) {
			rest.push(item);
			return;
		}
		if (insertAt === -1) insertAt = rest.length;
		groups.push({
			_key: item._key,
			_type: 'navMenuGroup',
			label: item.label,
			link: { _type: 'navLink', linkType: 'reference', reference: { _type: 'reference', _ref: country._id } },
			...(item.children?.length ? { children: item.children as NavChild[] } : {})
		});
		void index;
	});

	if (groups.length === 0) return null;

	const countriesItem: NavItem = {
		_key: COUNTRIES_KEY,
		_type: 'navMenuItem',
		label: COUNTRIES_LABEL,
		children: groups
	};
	rest.splice(insertAt, 0, countriesItem);
	return rest;
}

function describe(nav: NavItem[]) {
	for (const item of nav) {
		console.log(`  ${item.label}${item.link?.linkType ? '' : '  (opens its dropdown)'}`);
		for (const child of item.children ?? []) {
			if (child._type === 'navMenuGroup') {
				console.log(`      ▸ ${child.label}  → ${child.link?.reference?._ref ?? '(no link)'}`);
				for (const leaf of child.children ?? []) {
					console.log(`            · ${leaf.label}`);
				}
			} else {
				console.log(`      ▸ ${child.label}`);
			}
		}
	}
}

type Snapshot = Record<string, NavItem[] | null>;

async function main() {
	if (!TOKEN && !dryRun) {
		console.error('Missing write credentials. Set SANITY_API_TOKEN or log in via `pnpm exec sanity login`.');
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false
	});

	const ids =
		target === 'both' ? [SITE_SETTINGS_ID, DRAFT_ID] : target === 'draft' ? [DRAFT_ID] : [SITE_SETTINGS_ID];

	if (restorePath) {
		const snapshot = JSON.parse(readFileSync(restorePath, 'utf8')) as Snapshot;
		console.log(`Restore headerNav on ${PROJECT_ID}/${dataset} from ${restorePath}${dryRun ? ' (dry run)' : ''}`);
		for (const id of ids) {
			if (!(id in snapshot)) {
				console.log(`  ${id}: not in snapshot — skipped`);
				continue;
			}
			const nav = snapshot[id];
			console.log(`  ${id}: ${nav ? `${nav.length} top-level items` : 'unset headerNav'}`);
			if (dryRun) continue;
			if (nav) await client.patch(id).set({ headerNav: nav }).commit();
			else await client.patch(id).unset(['headerNav']).commit();
		}
		console.log(dryRun ? 'Dry run complete — no changes written.' : 'Done — restored.');
		return;
	}

	console.log(`Fold countries under "${COUNTRIES_LABEL}" on ${PROJECT_ID}/${dataset} (${target})${dryRun ? ' (dry run)' : ''}`);

	const countries = await fetchCountries(client);
	console.log(`  countries in ${dataset}: ${countries.map((c) => c.slug).join(', ') || '(none)'}`);

	const docs = await client.fetch<{ _id: string; headerNav: NavItem[] | null }[]>(
		`*[_id in $ids]{ _id, headerNav }`,
		{ ids }
	);

	const snapshot: Snapshot = {};
	for (const doc of docs) snapshot[doc._id] = doc.headerNav;
	if (backupPath) {
		writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
		console.log(`  backup written to ${backupPath}`);
	}

	for (const id of ids) {
		const doc = docs.find((d) => d._id === id);
		if (!doc) {
			console.log(`\n${id}: does not exist — skipped`);
			continue;
		}
		if (!doc.headerNav?.length) {
			console.log(`\n${id}: no authored menu — skipped (the site shows the built-in fallback)`);
			continue;
		}
		const next = reshape(doc.headerNav, countries);
		if (!next) {
			console.log(`\n${id}: ${alreadyMigrated(doc.headerNav) ? 'already carries groups' : 'no top-level country items'} — skipped`);
			continue;
		}
		console.log(`\n${id}:`);
		describe(next);
		if (dryRun) continue;
		await client.patch(id).set({ headerNav: next }).commit();
		console.log(`  written`);
	}

	console.log(dryRun ? '\nDry run complete — no changes written.' : '\nDone.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
