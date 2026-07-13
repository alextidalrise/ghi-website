#!/usr/bin/env tsx
/**
 * Seed `siteSettings.headerNav` (and `headerCta`) with the menu the site shipped
 * with before navigation moved into Sanity. This reproduces the previous hardcoded
 * set one-to-one, using internal paths so it does not depend on any other document:
 *
 *   Spain · Portugal · Front Line Collection · Buying Guide · Insights · About Us   [ Contact ]
 *
 * Editors can later swap any internal path for a reference (so the URL tracks the
 * slug) or add a second-level dropdown — this just establishes the starting point.
 *
 * Only `headerNav` and `headerCta` are touched; every other siteSettings field
 * (hero, featured grids) is left untouched. Idempotent: re-running overwrites the
 * two fields with the same content.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/seed-header-nav.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/seed-header-nav.ts --dataset development --dry-run
 *   pnpm --filter sanity exec tsx migrations/seed-header-nav.ts --dataset development --delete
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

/** An internal-path nav link object. */
function internalLink(path: string) {
	return { _type: 'navLink', linkType: 'internal', internalPath: path };
}

/** A top-level menu item keyed stably so re-runs don't churn array keys. */
function item(key: string, label: string, path: string) {
	return { _key: key, _type: 'navMenuItem', label, link: internalLink(path) };
}

const HEADER_NAV = [
	item('spain', 'Spain', '/spain'),
	item('portugal', 'Portugal', '/portugal'),
	item('front-line-collection', 'Front Line Collection', '/front-line-collection'),
	item('buying-guide', 'Buying Guide', '/guides'),
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

const DRAFT_ID = `drafts.${SITE_SETTINGS_ID}`;

/** True when an unpublished draft of the singleton exists. */
async function draftExists(client: SanityClient): Promise<boolean> {
	return client.fetch<boolean>(`defined(*[_id == $id][0]._id)`, { id: DRAFT_ID });
}

async function seed(client: SanityClient) {
	// Make sure the singleton exists before patching, without disturbing its other fields.
	await client.createIfNotExists({ _id: SITE_SETTINGS_ID, _type: 'siteSettings' });
	const fields = { headerNav: HEADER_NAV, headerCta: HEADER_CTA };
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
	} else {
		for (const entry of HEADER_NAV) {
			console.log(`  ${entry.label} → ${entry.link.internalPath}`);
		}
		console.log(`  [CTA] ${HEADER_CTA.label} → ${HEADER_CTA.link.internalPath}`);
	}

	if (dryRun) {
		console.log('Dry run complete — no changes written.');
		return;
	}

	if (doDelete) {
		await unset(client);
		console.log('Done — header navigation fields cleared (site falls back to the built-in menu).');
	} else {
		await seed(client);
		console.log('Done — header navigation seeded.');
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
