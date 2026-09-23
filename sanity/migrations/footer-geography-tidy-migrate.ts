#!/usr/bin/env tsx
/**
 * Tidy the geography on `siteSettings` now that the footer's country index is read from
 * the header menu (PR #189). Three edits, each idempotent:
 *
 *   1. Sort the country groups under the header's Countries item by each country's
 *      `displayOrder` (then name), the market order the rest of the site uses. Groups
 *      that are not countries keep their relative order after the countries.
 *   2. Add the Spanish locations the menu was missing (Mijas, Malaga) after San Pedro de
 *      Alcantara, with the menu's own `loc-<slug>` keys. Ojen is deliberately left out:
 *      it has no listings yet. A location already on the menu is not added twice.
 *   3. Remove the hand-built country columns from `footer.columns`: any column headed
 *      with a country the header lists. The site already skips them (the same rule lives
 *      in web/src/lib/footer/footerContent.ts); this clears the data so the Studio shows
 *      only what the footer renders. Editorial columns such as "Explore" are kept.
 *
 * Run order: deploy the web app with PR #189 first. Before it, the footer still renders
 * the authored country columns, so step 3 would empty its geography.
 *
 * Usage:
 *   pnpm --filter sanity footer:geography:dry-run -- --dataset development
 *   pnpm --filter sanity footer:geography -- --dataset development --backup /tmp/site-geo.json
 *   pnpm --filter sanity footer:geography -- --dataset development --restore /tmp/site-geo.json
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

/** Locations to add to a country's group, each placed after an existing location. */
const ADDITIONS: { country: string; slug: string; after: string }[] = [
	{ country: 'spain', slug: 'mijas', after: 'san-pedro-de-alcantara' },
	{ country: 'spain', slug: 'malaga', after: 'mijas' }
];

type NavLink = {
	_type: 'navLink';
	linkType?: 'reference' | 'internal' | 'external';
	reference?: { _type: 'reference'; _ref: string };
	internalPath?: string;
	externalUrl?: string;
};

type NavChild = { _key: string; _type: 'navMenuChild'; label: string; link?: NavLink };

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

type FooterColumn = { _key: string; heading?: string };
type Footer = { columns?: FooterColumn[] } & Record<string, unknown>;

type Place = {
	_id: string;
	slug: string;
	name: string;
	type: 'country' | 'location';
	parent: string | null;
	displayOrder: number | null;
};

type SiteDoc = { _id: string; headerNav: NavItem[] | null; footer: Footer | null };

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

/** Published countries and locations: the order source and the new references' targets. */
async function fetchPlaces(client: SanityClient): Promise<Place[]> {
	return client.fetch<Place[]>(
		`*[_type == "locationTaxonomy" && type in ["country", "location"] && !(_id in path("drafts.**")) && defined(slug.current)]{
			_id, "slug": slug.current, name, type, "parent": parent._ref, displayOrder
		}`
	);
}

const refOf = (link: NavLink | undefined) => link?.reference?._ref?.replace(/^drafts\./, '');
const isGroup = (child: NavChild | NavGroup): child is NavGroup => child._type === 'navMenuGroup';
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The country document a group links to, if any. */
function countryOf(group: NavGroup, places: Place[]): Place | undefined {
	const ref = refOf(group.link);
	return places.find((p) => p.type === 'country' && p._id === ref);
}

/** The items whose children include country groups (in practice, "Countries"). */
function countryItems(nav: NavItem[], places: Place[]): NavItem[] {
	return nav.filter((item) =>
		(item.children ?? []).some((child) => isGroup(child) && countryOf(child, places))
	);
}

/** Step 1: country groups by displayOrder, then name; other children after, in order. */
function sortCountries(item: NavItem, places: Place[]): { children: (NavChild | NavGroup)[]; changed: boolean } {
	const children = item.children ?? [];
	const rank = (child: NavChild | NavGroup) => {
		const country = isGroup(child) ? countryOf(child, places) : undefined;
		return country ? [country.displayOrder ?? 9999, country.name] as const : [Infinity, ''] as const;
	};
	const sorted = children
		.map((child, index) => ({ child, index, rank: rank(child) }))
		.sort(
			(a, b) =>
				a.rank[0] - b.rank[0] || a.rank[1].localeCompare(b.rank[1]) || a.index - b.index
		)
		.map(({ child }) => child);
	const changed = sorted.some((child, i) => child !== children[i]);
	return { children: sorted, changed };
}

/** Step 2: add the missing locations to their country's group. Returns what was added. */
function addLocations(item: NavItem, places: Place[]): string[] {
	const added: string[] = [];
	for (const addition of ADDITIONS) {
		const country = places.find((p) => p.type === 'country' && p.slug === addition.country);
		const location = places.find(
			(p) => p.type === 'location' && p.slug === addition.slug && p.parent === country?._id
		);
		if (!country || !location) {
			console.log(`  ! ${addition.slug}: no published location under ${addition.country} — skipped`);
			continue;
		}
		const group = (item.children ?? []).find(
			(child): child is NavGroup => isGroup(child) && countryOf(child, places)?._id === country._id
		);
		if (!group) continue;
		const kids = group.children ?? [];
		if (kids.some((kid) => refOf(kid.link) === location._id)) continue;

		const anchor = places.find((p) => p.type === 'location' && p.slug === addition.after);
		const anchorIndex = kids.findIndex((kid) => refOf(kid.link) === anchor?._id);
		const entry: NavChild = {
			_key: `loc-${location.slug}`,
			_type: 'navMenuChild',
			label: location.name,
			link: {
				_type: 'navLink',
				linkType: 'reference',
				reference: { _type: 'reference', _ref: location._id }
			}
		};
		kids.splice(anchorIndex >= 0 ? anchorIndex + 1 : kids.length, 0, entry);
		group.children = kids;
		added.push(`${group.label} ▸ ${location.name}`);
	}
	return added;
}

/** Step 3: footer columns headed with a country the header lists. */
function countryColumns(footer: Footer | null, countryNames: string[]): FooterColumn[] {
	return (footer?.columns ?? []).filter(
		(column) => column.heading && countryNames.some((name) => sameName(name, column.heading!))
	);
}

type Snapshot = Record<string, { headerNav: NavItem[] | null; footer: Footer | null }>;

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
		console.log(`Restore headerNav + footer on ${PROJECT_ID}/${dataset} from ${restorePath}${dryRun ? ' (dry run)' : ''}`);
		for (const id of ids) {
			const saved = snapshot[id];
			if (!saved) {
				console.log(`  ${id}: not in snapshot — skipped`);
				continue;
			}
			console.log(`  ${id}: restoring`);
			if (dryRun) continue;
			const patch = client.patch(id);
			if (saved.headerNav) patch.set({ headerNav: saved.headerNav });
			else patch.unset(['headerNav']);
			if (saved.footer) patch.set({ footer: saved.footer });
			else patch.unset(['footer']);
			await patch.commit();
		}
		console.log(dryRun ? 'Dry run complete — no changes written.' : 'Done — restored.');
		return;
	}

	console.log(`Tidy site geography on ${PROJECT_ID}/${dataset} (${target})${dryRun ? ' (dry run)' : ''}`);

	const places = await fetchPlaces(client);
	const docs = await client.fetch<SiteDoc[]>(`*[_id in $ids]{ _id, headerNav, footer }`, { ids });

	if (backupPath) {
		const snapshot: Snapshot = {};
		for (const doc of docs) snapshot[doc._id] = { headerNav: doc.headerNav, footer: doc.footer };
		writeFileSync(backupPath, JSON.stringify(snapshot, null, 2));
		console.log(`  backup written to ${backupPath}`);
	}

	for (const id of ids) {
		const doc = docs.find((d) => d._id === id);
		if (!doc) {
			console.log(`\n${id}: does not exist — skipped`);
			continue;
		}
		console.log(`\n${id}:`);

		const nav = structuredClone(doc.headerNav ?? []);
		let navChanged = false;
		const countryNames: string[] = [];

		for (const item of countryItems(nav, places)) {
			const { children, changed } = sortCountries(item, places);
			item.children = children;
			const order = children.filter(isGroup).map((g) => g.label).join(' · ');
			console.log(`  1. ${item.label} order: ${order}${changed ? '  (re-sorted)' : '  (already sorted)'}`);
			navChanged ||= changed;

			const added = addLocations(item, places);
			console.log(`  2. ${added.length ? `added ${added.join(', ')}` : 'no locations to add'}`);
			navChanged ||= added.length > 0;

			for (const child of children) if (isGroup(child) && countryOf(child, places)) countryNames.push(child.label);
		}
		if (countryNames.length === 0) console.log('  1–2. no country groups in the header menu — skipped');

		const stale = countryColumns(doc.footer, countryNames);
		const kept = (doc.footer?.columns ?? []).filter((column) => !stale.includes(column));
		console.log(
			`  3. ${stale.length ? `remove footer columns ${stale.map((c) => c.heading).join(', ')}` : 'no country columns in the footer'}` +
				`; keep ${kept.map((c) => c.heading).join(', ') || '(none)'}`
		);

		if (!navChanged && stale.length === 0) {
			console.log('  nothing to change');
			continue;
		}
		if (dryRun) continue;

		const patch = client.patch(id);
		if (navChanged) patch.set({ headerNav: nav });
		if (stale.length) patch.unset(stale.map((column) => `footer.columns[_key=="${column._key}"]`));
		await patch.commit();
		console.log('  written');
	}

	console.log(dryRun ? '\nDry run complete — no changes written.' : '\nDone.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
