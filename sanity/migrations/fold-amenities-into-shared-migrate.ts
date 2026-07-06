#!/usr/bin/env tsx
/**
 * Retire the legacy `content.amenities` string array now that amenities are a
 * development-only concept living in `development.sharedAmenities`.
 *
 * - `development` docs: each `content.amenities` string is folded into
 *   `sharedAmenities` as a `featureHighlight` (deduped case-insensitively against
 *   existing labels), then `content.amenities` is unset.
 * - `unit` / `unitType` docs: `content.amenities` is unset (it never rendered and
 *   has no destination — amenities are not a unit-level concept).
 *
 * Usage:
 *   pnpm --filter sanity migrate:fold-amenities:dry-run --dataset development
 *   pnpm --filter sanity migrate:fold-amenities --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { randomUUID } from 'node:crypto';
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

type FeatureHighlight = {
	_key?: string;
	_type?: string;
	label?: string | null;
	value?: string | null;
	isHighlighted?: boolean | null;
};

type Candidate = {
	_id: string;
	_type: string;
	amenities?: string[] | null;
	sharedAmenities?: FeatureHighlight[] | null;
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
		`*[_type in ["development", "unit", "unitType"] && defined(content.amenities)]{
			_id,
			_type,
			"amenities": content.amenities,
			sharedAmenities
		}`
	);
}

/** Fold amenity strings into a sharedAmenities list, deduped by lowercase label. */
function foldAmenities(
	existing: FeatureHighlight[] | null | undefined,
	amenities: string[]
): FeatureHighlight[] {
	const seen = new Set<string>(
		(existing ?? [])
			.map((item) => item?.label?.trim().toLowerCase())
			.filter((label): label is string => Boolean(label))
	);
	const additions: FeatureHighlight[] = [];
	for (const raw of amenities) {
		const label = raw?.trim();
		if (!label) continue;
		const key = label.toLowerCase();
		if (seen.has(key)) continue;
		seen.add(key);
		additions.push({ _key: randomUUID(), _type: 'featureHighlight', label, isHighlighted: true });
	}
	return [...(existing ?? []), ...additions];
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

	console.log(`Fold content.amenities → sharedAmenities → ${PROJECT_ID}/${dataset}${dryRun ? ' (dry run)' : ''}`);

	const candidates = await fetchCandidates(client);
	console.log(`Found ${candidates.length} document(s) carrying content.amenities.`);

	for (const doc of candidates) {
		const amenities = (doc.amenities ?? []).filter((a): a is string => typeof a === 'string');

		if (doc._type === 'development') {
			const nextShared = foldAmenities(doc.sharedAmenities, amenities);
			const added = nextShared.length - (doc.sharedAmenities?.length ?? 0);
			console.log(
				`  development ${doc._id}: fold ${amenities.length} amenity(ies) → +${added} sharedAmenities, unset content.amenities`
			);
			if (dryRun) continue;
			await client
				.patch(doc._id)
				.set({ sharedAmenities: nextShared })
				.unset(['content.amenities'])
				.commit({ autoGenerateArrayKeys: false });
		} else {
			console.log(`  ${doc._type} ${doc._id}: unset content.amenities`);
			if (dryRun) continue;
			await client.patch(doc._id).unset(['content.amenities']).commit({ autoGenerateArrayKeys: false });
		}
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
