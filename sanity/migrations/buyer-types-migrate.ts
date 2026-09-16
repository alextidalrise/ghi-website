#!/usr/bin/env node
/**
 * Seed the buyer types and tag every guide with one.
 *
 * The Guides hub now asks "Who are you buying as?" and "Where are you looking?". Markets
 * were already documents; buyer type was only a free-text `audienceLabel` chip ("For UK
 * buyers"), which nothing can filter on. This creates the `buyerType` documents and sets
 * `guide.audience` from each guide's existing label.
 *
 * ADDITIVE ONLY. It creates new documents and sets a new field; it changes the shape of
 * nothing that `main` reads, so it is safe to run before the web deploy — and should be,
 * because the new hub finds no buyer types without it. (Contrast country-refs-migrate,
 * which changed a field's shape and broke the deployed code: see the memory note.)
 *
 * Idempotent: buyer types are created only if missing (fixed IDs), and a guide that
 * already has an audience is left alone.
 *
 * Usage:
 *   pnpm --filter sanity migrate:buyer-types -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:buyer-types -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

/** The buyer types the four existing guides are written for, in hub order. */
const BUYER_TYPES = [
	{ _id: 'buyerType-uk-buyer', name: 'UK buyer', slug: 'uk-buyer', order: 0, match: /\buk\b/i },
	{
		_id: 'buyerType-international-buyer',
		name: 'International buyer',
		slug: 'international-buyer',
		order: 1,
		match: /international/i
	}
] as const;

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

type GuideDoc = { _id: string; title?: string | null; audienceLabel?: string | null; audience?: unknown };

async function main() {
	const client = createMigrationClient();
	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}\n`);

	const transaction = client.transaction();
	let writes = 0;

	const existing = new Set(
		await client.fetch<string[]>(`*[_type == "buyerType"]._id`)
	);

	console.log('Buyer types');
	for (const type of BUYER_TYPES) {
		if (existing.has(type._id)) {
			console.log(`  ${type.slug}: already exists`);
			continue;
		}
		console.log(`  ${type.slug}: create "${type.name}"`);
		transaction.createIfNotExists({
			_id: type._id,
			_type: 'buyerType',
			name: type.name,
			slug: { _type: 'slug', current: type.slug },
			order: type.order
		});
		writes += 1;
	}

	console.log('\nGuides');
	const guides = await client.fetch<GuideDoc[]>(`*[_type == "guide"]{ _id, title, audienceLabel, audience }`);
	const unmatched: string[] = [];
	for (const guide of guides) {
		const label = guide.title ?? guide._id;
		if (guide.audience) {
			console.log(`  ${label}: already tagged`);
			continue;
		}
		const type = BUYER_TYPES.find((t) => t.match.test(guide.audienceLabel ?? ''));
		if (!type) {
			unmatched.push(`${label} (audienceLabel: ${JSON.stringify(guide.audienceLabel ?? null)})`);
			console.log(`  ${label}: SKIPPED — no buyer type in its label`);
			continue;
		}
		console.log(`  ${label}: audience → ${type.slug}`);
		transaction.patch(
			client.patch(guide._id).set({ audience: { _type: 'reference', _ref: type._id } })
		);
		writes += 1;
	}

	if (unmatched.length > 0) {
		console.log('\nLeft untagged (applies to every buyer, or set in Studio):');
		for (const line of unmatched) console.log(`  ${line}`);
	}

	if (dryRun) {
		console.log(`\nDry run: ${writes} write(s) planned. Nothing written.`);
		return;
	}
	if (writes === 0) {
		console.log('\nNothing to do.');
		return;
	}
	await transaction.commit();
	console.log(`\nApplied ${writes} write(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
