#!/usr/bin/env node
/**
 * Seed the Front Line Collection's new curated membership switch.
 *
 * The collection used to be every listing with `golf.golfRelevance == "frontline_golf"`.
 * It is now a curated showcase of A-class, high-value homes: a listing must be frontline
 * AND have `includeInFrontlineCollection == true`. Without this seed the collection and the
 * homepage frontline rail would be empty the moment the web deploy lands.
 *
 * The seed switches the collection on for every currently *published* frontline listing and
 * development except the Murcia/Alicante records James asked to drop (Basecamp todo
 * 10330415466). That is a starting point for James's review, not an A-class judgement: the
 * survivors are printed so the ones that don't qualify can be switched off in Studio.
 * Their golf relevance is not touched.
 *
 * ADDITIVE ONLY. It sets a new field that `main` does not read, so it is safe — and must be
 * run — before the web deploy. Drafts are patched alongside their published documents, so a
 * later publish of an open draft doesn't drop the switch.
 *
 * Idempotent: listings already carrying the field (either value) are left alone, so an
 * editor's choice is never overwritten by a re-run.
 *
 * Usage:
 *   pnpm --filter sanity migrate:frontline-collection -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:frontline-collection -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

/** Frontline, but excluded from the curated collection at James's request. */
const EXCLUDED_IDS = new Set([
	'kyero-import-msn-bmvsg', // Murcia — La Serena Golf (GHI00436)
	'kyero-import-msn-chv32cv', // Murcia — Corvera Golf Resort (GHI00432)
	'kyero-import-msn-mmgr43', // Murcia — Mar Menor Golf Resort (GHI00388)
	'kyero-import-msr-lmc188b', // Murcia — La Manga Club (GHI00270)
	'kyero-import-msr-ta73ev', // Murcia — El Valle Golf Resort (GHI00255)
	'kyero-import-msn-lf17slc' // Alicante — Las Colinas Golf & Country Club (GHI00403)
]);

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		return (JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string }).authToken;
	} catch {
		return undefined;
	}
}

function createMigrationClient(): SanityClient {
	if (!TOKEN) throw new Error('Missing Sanity token. Set SANITY_API_TOKEN or log in via sanity CLI.');
	return createClient({ projectId: PROJECT_ID, dataset, apiVersion: '2025-01-01', token: TOKEN, useCdn: false });
}

type FrontlineDoc = {
	_id: string;
	title?: string | null;
	country?: string | null;
	location?: string | null;
	hasField: boolean;
	draft?: { _id: string; hasField: boolean } | null;
};

async function main() {
	const client = createMigrationClient();
	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}\n`);

	// Published documents only (no `drafts.` prefix), each with its draft if one is open.
	const docs = await client.fetch<FrontlineDoc[]>(`
    *[
      ((_type == "propertyListing" && listingKind in ["property", "unit"]) || _type == "development")
      && !(_id in path("drafts.**"))
      && status == "published"
      && golf.golfRelevance == "frontline_golf"
    ]{
      _id,
      title,
      "country": coalesce(location.country->name, location.community->parent->parent->name),
      "location": location.location->name,
      "hasField": defined(includeInFrontlineCollection),
      "draft": *[_id == "drafts." + ^._id][0]{ _id, "hasField": defined(includeInFrontlineCollection) }
    } | order(country asc, location asc, title asc)
  `);

	const transaction = client.transaction();
	let writes = 0;
	const seeded: string[] = [];

	for (const doc of docs) {
		const label = `${doc.title ?? '(untitled)'} — ${doc.location ?? '?'}, ${doc.country ?? '?'} (${doc._id})`;
		if (EXCLUDED_IDS.has(doc._id)) {
			console.log(`  exclude  ${label}`);
			continue;
		}
		if (doc.hasField) {
			console.log(`  skip     ${label} (already set)`);
			continue;
		}
		console.log(`  include  ${label}`);
		seeded.push(label);
		transaction.patch(client.patch(doc._id).set({ includeInFrontlineCollection: true }));
		writes += 1;
		if (doc.draft && !doc.draft.hasField) {
			transaction.patch(client.patch(doc.draft._id).set({ includeInFrontlineCollection: true }));
			writes += 1;
		}
	}

	const missing = [...EXCLUDED_IDS].filter((id) => !docs.some((doc) => doc._id === id));
	if (missing.length > 0) {
		console.log(`\nExcluded ids not found as published frontline listings: ${missing.join(', ')}`);
	}

	console.log(`\n${seeded.length} listing(s) switched on for James's review.`);

	if (dryRun) {
		console.log(`Dry run: ${writes} write(s) planned. Nothing written.`);
		return;
	}
	if (writes === 0) {
		console.log('Nothing to do.');
		return;
	}
	await transaction.commit();
	console.log(`Applied ${writes} write(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
