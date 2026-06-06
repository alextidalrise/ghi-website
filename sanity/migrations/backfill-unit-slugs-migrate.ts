#!/usr/bin/env node
/**
 * Backfill the now-routable `unit` documents.
 *
 * `slug` is required on units (the final segment of the nested unit URL). This
 * migration derives a slug from each unit's name/number for any unit missing one,
 * deduplicating within each parent development so sibling units never collide.
 *
 * `parentUnitType` (the typology a unit belongs to) and `ghiListingId` (assigned by
 * the external pipeline) cannot be invented here, so units missing them are REPORTED
 * for manual follow-up rather than guessed. Both are optional in the schema; a unit
 * without a unit type falls back to its development's imagery.
 *
 * Usage:
 *   pnpm --filter sanity migrate:backfill-unit-slugs -- --dataset development
 *   pnpm --filter sanity migrate:backfill-unit-slugs:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

type UnitDocument = {
	_id: string;
	unitName?: string | null;
	unitNumber?: string | null;
	slug?: { current?: string | null } | null;
	parentDevelopmentId?: string | null;
	parentUnitTypeId?: string | null;
	ghiListingId?: string | null;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetIndex >= 0 ? args[datasetIndex + 1] : (process.env.SANITY_STUDIO_DATASET ?? 'development');

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) {
		return undefined;
	}

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

/** Lowercase, ASCII-fold, collapse to hyphens — matches Sanity's default slugifier. */
function slugify(input: string): string {
	return input
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 96);
}

function baseSlugFor(unit: UnitDocument): string {
	const source = unit.unitName?.trim() || unit.unitNumber?.trim() || '';
	const slug = slugify(source);
	return slug || `unit-${unit._id.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase()}`;
}

/** Ensure a slug is unique within a set already taken; append -2, -3, … on collision. */
function uniqueSlug(base: string, taken: Set<string>): string {
	if (!taken.has(base)) {
		taken.add(base);
		return base;
	}
	let n = 2;
	while (taken.has(`${base}-${n}`)) n += 1;
	const result = `${base}-${n}`;
	taken.add(result);
	return result;
}

async function main() {
	const client = createMigrationClient();

	const units = await client.fetch<UnitDocument[]>(`*[_type == "unit"]{
		_id,
		unitName,
		unitNumber,
		slug,
		"parentDevelopmentId": parentDevelopment._ref,
		"parentUnitTypeId": parentUnitType._ref,
		ghiListingId
	}`);

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Units found: ${units.length}`);

	// Slugs already taken per development, so backfilled slugs don't collide with
	// existing ones or with each other.
	const takenByDev = new Map<string, Set<string>>();
	for (const unit of units) {
		const devId = unit.parentDevelopmentId ?? '__orphan__';
		const set = takenByDev.get(devId) ?? new Set<string>();
		if (unit.slug?.current) set.add(unit.slug.current);
		takenByDev.set(devId, set);
	}

	const needsSlug = units.filter((u) => !u.slug?.current);
	const missingUnitType = units.filter((u) => !u.parentUnitTypeId);
	const missingGhiId = units.filter((u) => !u.ghiListingId);

	console.log(`Units needing a slug: ${needsSlug.length}`);
	console.log(`Units missing a unit type (manual link needed): ${missingUnitType.length}`);
	console.log(`Units missing a GHI listing ID (pipeline-assigned): ${missingGhiId.length}`);

	const transaction = client.transaction();
	const assignments: Array<{ id: string; slug: string }> = [];

	for (const unit of needsSlug) {
		const devId = unit.parentDevelopmentId ?? '__orphan__';
		const taken = takenByDev.get(devId) ?? new Set<string>();
		const slug = uniqueSlug(baseSlugFor(unit), taken);
		takenByDev.set(devId, taken);
		assignments.push({ id: unit._id, slug });
		transaction.patch(unit._id, (patch) =>
			patch.set({ slug: { _type: 'slug', current: slug } })
		);
	}

	if (missingUnitType.length > 0) {
		console.log('\nUnits missing parentUnitType — link these to a unit type in Studio:');
		for (const u of missingUnitType) {
			console.log(`  · ${u._id} (${u.unitName ?? u.unitNumber ?? 'unnamed'})`);
		}
	}

	if (missingGhiId.length > 0) {
		console.log('\nUnits missing ghiListingId — assign via the listing-ID pipeline:');
		for (const u of missingGhiId) {
			console.log(`  · ${u._id} (${u.unitName ?? u.unitNumber ?? 'unnamed'})`);
		}
	}

	if (assignments.length === 0) {
		console.log('\nNo slugs to backfill.');
		return;
	}

	if (dryRun) {
		console.log('\nWould set the following slugs:');
		for (const a of assignments) {
			console.log(`  · ${a.id} → ${a.slug}`);
		}
		return;
	}

	await transaction.commit();
	console.log(`\nBackfilled slugs on ${assignments.length} unit(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
