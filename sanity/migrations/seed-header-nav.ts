#!/usr/bin/env tsx
/**
 * Bootstrap `siteSettings.headerNav` (and `headerCta`) on a dataset that has no menu yet:
 *
 *   Spain ▸ 6 locations · Portugal ▸ 4 locations · Front Line Collection ·
 *   Buying Guide · Partners · Insights · About Us          [ Contact ]
 *
 * This is a BOOTSTRAP, not a source of truth. The menu is editorial content: editors own
 * it in the Studio, and what they author there outranks anything in this file. So by
 * default the seed refuses to run when a menu already exists — an earlier version
 * overwrote the whole `headerNav` array on every run, which silently destroyed the
 * authored dropdowns under Spain and Portugal (and the Partners entry) the first time
 * someone re-ran it to pick up a new top-level item. Adding an item to the menu is a
 * Studio job now; adding it here does nothing to a dataset that is already seeded.
 *
 * `--force` overwrites an existing menu. It is the only way to clobber authored content,
 * and it exists for exactly one purpose: restoring the menu wholesale from this file.
 *
 * The country dropdowns link to location documents by reference, so their URLs track the
 * location slugs. Any child whose location is missing from the target dataset is skipped
 * with a warning rather than seeded as a dangling reference — that keeps this runnable
 * against an empty dataset, where it just seeds the top level.
 *
 * Usage:
 *   pnpm --filter sanity headernav:seed -- --dataset development
 *   pnpm --filter sanity headernav:seed:dry-run -- --dataset development
 *   pnpm --filter sanity headernav:seed -- --dataset development --force   # overwrite
 *   pnpm --filter sanity headernav:delete -- --dataset development
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
const force = args.includes('--force');
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

/** A link to a hand-typed path on this site. */
function internalLink(path: string) {
	return { _type: 'navLink', linkType: 'internal', internalPath: path };
}

/** A link to a document — the URL is derived from its slug at query time. */
function referenceLink(id: string) {
	return {
		_type: 'navLink',
		linkType: 'reference',
		reference: { _type: 'reference', _ref: id }
	};
}

type Child = { _key: string; _type: 'navMenuChild'; label: string; link: ReturnType<typeof referenceLink> };
type Item = {
	_key: string;
	_type: 'navMenuItem';
	label: string;
	link: ReturnType<typeof internalLink>;
	children?: Child[];
};

/** A dropdown entry pointing at a location document. Keyed off the slug so re-runs are stable. */
function location(slug: string, label: string): Child {
	return {
		_key: `loc-${slug}`,
		_type: 'navMenuChild',
		label,
		link: referenceLink(`places-location-${slug}`)
	};
}

/** A top-level item, keyed stably so re-runs don't churn array keys. */
function item(key: string, label: string, path: string, children?: Child[]): Item {
	const base: Item = { _key: key, _type: 'navMenuItem', label, link: internalLink(path) };
	return children?.length ? { ...base, children } : base;
}

const HEADER_NAV: Item[] = [
	item('spain', 'Spain', '/spain', [
		location('marbella', 'Marbella'),
		location('nueva-andalucia', 'Nueva Andalucia'),
		location('benahavis', 'Benahavis'),
		location('estepona', 'Estepona'),
		location('sotogrande', 'Sotogrande'),
		location('san-pedro-de-alcantara', 'San Pedro de Alcantara')
	]),
	item('portugal', 'Portugal', '/portugal', [
		location('monte-rei', 'Monte Rei'),
		location('palmares', 'Palmares'),
		location('quinta-do-lago', 'Quinta do Lago'),
		location('vilamoura', 'Vilamoura')
	]),
	item('front-line-collection', 'Front Line Collection', '/front-line-collection'),
	item('buying-guide', 'Buying Guide', '/guides'),
	item('partners', 'Partners', '/partners'),
	item('insights', 'Insights', '/insights'),
	item('about-us', 'About Us', '/about')
];

const HEADER_CTA = { label: 'Contact', link: internalLink('/contact') };

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

/** True when either the published doc or its draft already carries a non-empty menu. */
async function navExists(client: SanityClient): Promise<boolean> {
	return client.fetch<boolean>(
		`count(*[_id in [$published, $draft] && count(headerNav) > 0]) > 0`,
		{ published: SITE_SETTINGS_ID, draft: DRAFT_ID }
	);
}

/**
 * Drop dropdown children whose location document is absent from this dataset. Seeding a
 * dangling reference would leave the child with no resolvable URL, so the site would drop
 * it from the menu anyway — better to say so out loud than to write broken content.
 */
async function withExistingLocationsOnly(client: SanityClient, nav: Item[]): Promise<Item[]> {
	const ids = nav.flatMap((i) => i.children ?? []).map((c) => c.link.reference._ref);
	if (ids.length === 0) return nav;

	const present = new Set(await client.fetch<string[]>(`*[_id in $ids]._id`, { ids }));

	return nav.map((entry) => {
		if (!entry.children?.length) return entry;
		const kept = entry.children.filter((c) => present.has(c.link.reference._ref));
		for (const child of entry.children) {
			if (!present.has(child.link.reference._ref)) {
				console.warn(
					`  ! skipping “${entry.label} › ${child.label}” — ${child.link.reference._ref} not in ${dataset}`
				);
			}
		}
		return kept.length ? { ...entry, children: kept } : { ...entry, children: undefined };
	});
}

async function seed(client: SanityClient, nav: Item[]) {
	// Make sure the singleton exists before patching, without disturbing its other fields.
	await client.createIfNotExists({ _id: SITE_SETTINGS_ID, _type: 'siteSettings' });
	const fields = { headerNav: nav, headerCta: HEADER_CTA };
	await client.patch(SITE_SETTINGS_ID).set(fields).commit();
	// The Studio edits the draft, and publishing it would otherwise overwrite the
	// published doc — wiping these fields. Mirror them onto the draft when one exists so
	// the menu shows in the Studio and survives the next publish.
	if (await draftExists(client)) {
		await client.patch(DRAFT_ID).set(fields).commit();
	}
}

async function unset(client: SanityClient) {
	await client.patch(SITE_SETTINGS_ID).unset(['headerNav', 'headerCta']).commit();
	if (await draftExists(client)) {
		await client.patch(DRAFT_ID).unset(['headerNav', 'headerCta']).commit();
	}
}

/** Print the menu about to be written, dropdowns and all. */
function describe(nav: Item[]) {
	for (const entry of nav) {
		console.log(`  ${entry.label} → ${entry.link.internalPath}`);
		for (const child of entry.children ?? []) {
			console.log(`      ▸ ${child.label} → ${child.link.reference._ref}`);
		}
	}
	console.log(`  [CTA] ${HEADER_CTA.label} → ${HEADER_CTA.link.internalPath}`);
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

	const verb = doDelete ? 'Unset headerNav/headerCta on' : 'Seed headerNav/headerCta into';
	console.log(`${verb} ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	if (doDelete) {
		console.log('  unset: headerNav, headerCta');
		if (dryRun) {
			console.log('Dry run complete — no changes written.');
			return;
		}
		await unset(client);
		console.log('Done — header navigation fields cleared (site falls back to the built-in menu).');
		return;
	}

	// The guard that stops this seed from eating the menu editors actually authored.
	if (!force && (await navExists(client))) {
		console.log(
			`\nA header menu already exists in ${dataset} — leaving it alone.\n` +
				'It is editorial content, and the Studio is the place to change it. This seed only\n' +
				'bootstraps a dataset that has no menu yet.\n\n' +
				'Re-run with --force to overwrite it with the menu in this file (destroys anything\n' +
				'authored in the Studio).'
		);
		return;
	}

	const nav = await withExistingLocationsOnly(client, HEADER_NAV);
	describe(nav);

	if (dryRun) {
		console.log('Dry run complete — no changes written.');
		return;
	}

	if (force) console.log('\n--force: overwriting the existing menu.');
	await seed(client, nav);
	console.log('Done — header navigation seeded.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
