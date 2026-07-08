#!/usr/bin/env tsx
/**
 * Collapse `developmentName` into `title` so developments carry a single name
 * field, matching property listings (which only have `title`).
 *
 * For every development the canonical `developmentName` becomes the new `title`,
 * then `developmentName` is unset. Because `developmentName` is the clean name
 * (no location), this also strips any trailing location an editor typed into the
 * old title — e.g. title "Natura Village, Vilamoura" → "Natura Village".
 *
 * The dry run classifies each document so a title that carries MORE than the
 * bare name + a trailing location (i.e. genuine editorial wording that would be
 * lost) is flagged loudly for review before anything is written.
 *
 * Usage:
 *   pnpm --filter sanity migrate:collapse-dev-name:dry-run --dataset development
 *   pnpm --filter sanity migrate:collapse-dev-name --dataset development
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
const datasetIndex = args.indexOf('--dataset');
const dataset =
	(datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ??
	process.env.SANITY_STUDIO_DATASET ??
	'development';

if (dataset === 'production') {
	console.error('Refusing to run against the production dataset (dev-only pass).');
	process.exit(1);
}

type Development = {
	_id: string;
	ghiListingId?: string | null;
	developmentName?: string | null;
	title?: string | null;
	country?: string | null;
	location?: string | null;
	community?: string | null;
};

/**
 * Explicit titles for records where neither field can be cleaned automatically:
 * the location is embedded mid-phrase (not a discrete taxonomy token), or the
 * shortest-candidate heuristic would strip wording we want to keep. Keyed by the
 * stable ghiListingId so it matches both the published and draft documents.
 */
const OVERRIDES: Record<string, string> = {
	// "…, La Reserva Club Sotogrande" — location baked into the name phrase.
	GHI00147: 'Village Verde Phase 2',
	GHI00148: 'The 15',
	GHI00149: 'The Seven',
	// Keep the marketing wording rather than reducing to the bare name.
	GHI00184: 'Avenue Marbella Luxury Villas'
};

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

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Strip trailing " — <token>" / ", <token>" segments matching a location name,
    iteratively — mirrors the development detail-page H1 logic. */
function stripTrailingLocation(title: string, locationNames: string[]): string {
	let out = title.trim();
	let changed = true;
	while (changed) {
		changed = false;
		for (const name of locationNames) {
			const re = new RegExp(`\\s*[—–\\-,]\\s*${escapeRegExp(name)}\\s*$`, 'i');
			const next = out.replace(re, '').trim();
			if (next && next !== out) {
				out = next;
				changed = true;
			}
		}
	}
	return out;
}

/**
 * Derive the collapsed title. Neither `title` nor `developmentName` is reliably
 * free of a trailing location, so strip location from BOTH and take the shortest
 * clean candidate (ties favour the stripped title). An explicit override wins
 * outright. Falls back to the raw title/name if stripping empties everything.
 */
function deriveTitle(doc: Development): { title: string; source: 'override' | 'strip' } {
	const override = doc.ghiListingId ? OVERRIDES[doc.ghiListingId.toUpperCase()] : undefined;
	if (override) return { title: override, source: 'override' };

	const locationNames = [doc.community, doc.location, doc.country].filter(
		(part): part is string => Boolean(part && part.trim())
	);
	const candidates = [
		stripTrailingLocation(doc.title ?? '', locationNames),
		stripTrailingLocation(doc.developmentName ?? '', locationNames)
	]
		.map((value) => value.trim())
		.filter((value): value is string => Boolean(value));

	if (candidates.length === 0) {
		return { title: (doc.title ?? doc.developmentName ?? '').trim(), source: 'strip' };
	}
	// Shortest wins; reduce keeps the first (stripped title) on a length tie.
	const shortest = candidates.reduce((a, b) => (b.length < a.length ? b : a));
	return { title: shortest, source: 'strip' };
}

async function fetchDevelopments(client: SanityClient): Promise<Development[]> {
	return client.fetch<Development[]>(
		`*[_type == "development" && defined(developmentName)]{
			_id,
			ghiListingId,
			developmentName,
			title,
			"country": location.country->name,
			"location": location.location->name,
			"community": location.community->name
		} | order(_id asc)`
	);
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
		apiVersion: '2025-01-01',
		useCdn: false
	});

	console.log(
		`Collapse developmentName → title on ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`
	);

	const docs = await fetchDevelopments(client);
	console.log(`Found ${docs.length} development(s) with developmentName.\n`);

	let changed = 0;

	for (const doc of docs) {
		const currentTitle = (doc.title ?? '').trim();
		const { title: nextTitle, source } = deriveTitle(doc);
		const willChange = nextTitle !== currentTitle;
		if (willChange) changed += 1;

		const marker = source === 'override' ? 'override' : willChange ? 'strip' : '=';
		console.log(`  [${marker}] ${doc._id}`);
		console.log(`      title "${currentTitle}"${willChange ? ` → "${nextTitle}"` : ' (unchanged)'}`);

		if (dryRun) continue;
		await client.patch(doc._id).set({ title: nextTitle }).unset(['developmentName']).commit();
	}

	console.log(
		`\n${changed} title(s) rewritten, ${docs.length} developmentName field(s) unset.` +
			(dryRun ? '\nDry run complete — no changes written.' : '\nMigration complete.')
	);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
