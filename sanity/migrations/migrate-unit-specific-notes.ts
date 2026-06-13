#!/usr/bin/env tsx
/**
 * Move legacy `unitSpecificNotes` (a top-level text field on `unit`
 * documents pre-redesign) into the new generic `internal.notes` field,
 * then unset the legacy field. The redesign collapsed all per-document
 * private notes into the shared `internal {}` namespace, but this field
 * was missed by the wipe migration because it carries genuine source
 * information that should not be discarded.
 *
 * Behaviour:
 *   - If a unit has `unitSpecificNotes` and no `internal.notes`,
 *     copy the value across.
 *   - If a unit has both, append `unitSpecificNotes` to the existing
 *     `internal.notes` separated by a blank line.
 *   - Always unset `unitSpecificNotes` afterwards.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/migrate-unit-specific-notes.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/migrate-unit-specific-notes.ts --dataset development --dry-run
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
	console.error('Refusing to run against the production dataset.');
	process.exit(1);
}

type Candidate = {
	_id: string;
	unitSpecificNotes: string;
	existingNotes?: string | null;
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

async function fetchCandidates(client: SanityClient): Promise<Candidate[]> {
	return client.fetch<Candidate[]>(
		`*[_type == "unit" && defined(unitSpecificNotes)]{
			_id,
			unitSpecificNotes,
			"existingNotes": internal.notes
		}`
	);
}

function mergedNotes(existing: string | null | undefined, addition: string): string {
	const trimmed = (existing ?? '').trim();
	return trimmed ? `${trimmed}\n\n${addition.trim()}` : addition.trim();
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

	console.log(
		`Migrate unit.unitSpecificNotes → unit.internal.notes (${PROJECT_ID}/${dataset})${dryRun ? ' (dry run)' : ''}`
	);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} unit(s) with unitSpecificNotes set.`);

	let merged = 0;
	let copied = 0;
	for (const doc of candidates) {
		const next = mergedNotes(doc.existingNotes, doc.unitSpecificNotes);
		const isMerge = !!(doc.existingNotes && doc.existingNotes.trim());
		if (isMerge) merged += 1;
		else copied += 1;
		console.log(`  ${doc._id}: ${isMerge ? 'merge' : 'copy'} → internal.notes`);
		if (dryRun) continue;
		await client
			.patch(doc._id)
			.set({ 'internal.notes': next })
			.unset(['unitSpecificNotes'])
			.commit();
	}

	console.log(
		`Summary: ${copied} copied into empty internal.notes, ${merged} merged into existing.`
	);
	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
