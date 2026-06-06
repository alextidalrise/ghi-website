#!/usr/bin/env node
/**
 * Additive seed: populate the overview section (publicDescription) — and a short
 * tagline where one is missing — with placeholder lorem on the country/location
 * pages that have a hero, so the AreaOverview reveal can be previewed end-to-end.
 *
 * This is intentionally NOT the wipe-and-reseed in seed-location-taxonomy.ts: it
 * only patches the named docs (and their draft twins), so existing taxonomy and
 * hero work is untouched.
 *
 * Usage:
 *   tsx migrations/seed-overview-lorem.ts --dataset development
 *   tsx migrations/seed-overview-lorem.ts --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnvFile(join(dirname(fileURLToPath(import.meta.url)), '..', '.env.local'));

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const COUNTRY_OVERVIEW = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
	'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus, et porta nibh ultricies in. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; aenean fermentum elit eu magna tincidunt, nec mattis nisl posuere. Integer feugiat scelerisque varius morbi enim nunc faucibus.'
].join('\n\n');

const LOCATION_OVERVIEW = [
	'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
	'Sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos.',
	'Qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur autem vel eum iure reprehenderit.'
].join('\n\n');

type Target = {
	ids: string[];
	publicDescription: string;
	/** Only set when the doc has no tagline yet — never clobbers a real one. */
	taglineIfMissing?: string;
};

const TARGETS: Target[] = [
	{
		ids: ['places-country-spain', 'drafts.places-country-spain'],
		publicDescription: COUNTRY_OVERVIEW
	},
	{ ids: ['places-location-marbella'], publicDescription: LOCATION_OVERVIEW },
	{
		ids: ['places-location-nueva-andalucia'],
		publicDescription: LOCATION_OVERVIEW,
		taglineIfMissing: "Marbella's Golf Valley"
	},
	{ ids: ['places-location-sotogrande'], publicDescription: LOCATION_OVERVIEW },
	{ ids: ['places-location-estepona'], publicDescription: LOCATION_OVERVIEW }
];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

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
		if (key && process.env[key] === undefined) {
			process.env[key] = value;
		}
	}
}

function createClientOrThrow(): SanityClient {
	if (!TOKEN && !dryRun) {
		throw new Error('Missing write credentials. Set SANITY_API_TOKEN or log in via sanity CLI.');
	}
	return createClient({
		projectId: PROJECT_ID,
		dataset,
		apiVersion: '2025-01-01',
		token: TOKEN,
		useCdn: false
	});
}

async function main() {
	console.log(`Overview lorem seed → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);
	const client = createClientOrThrow();
	const actions: string[] = [];

	for (const target of TARGETS) {
		for (const id of target.ids) {
			const existing = await client.fetch<{ tagline?: string | null } | null>(
				`*[_id == $id][0]{ tagline }`,
				{ id }
			);
			if (!existing) {
				actions.push(`skip ${id} (not found)`);
				continue;
			}

			const set: Record<string, string> = { publicDescription: target.publicDescription };
			if (target.taglineIfMissing && !existing.tagline) {
				set.tagline = target.taglineIfMissing;
			}

			actions.push(`patch ${id} (${Object.keys(set).join(', ')})`);
			if (!dryRun) await client.patch(id).set(set).commit();
		}
	}

	console.log(`\nPlanned actions: ${actions.length}`);
	for (const action of actions) console.log(`  • ${action}`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
