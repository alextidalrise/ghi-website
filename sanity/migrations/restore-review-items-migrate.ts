#!/usr/bin/env tsx
/**
 * Restore reviewItems[] that were lost when wipe-legacy-gating-fields.ts
 * unset the legacy `workflow` object. Pre-redesign, review items lived at
 * `workflow.reviewItems`; the wipe deleted the whole `workflow` object,
 * including those items. Sanity stores full document history server-side,
 * so we can time-travel to a moment just before the wipe and copy the
 * items back to the new top-level `reviewItems` field.
 *
 * Field mapping (old reviewItem → new reviewItem):
 *   - _type, _key, label, detail, blocksPublish, category   → kept
 *   - severity, sourceLevel, visibleToReviewer              → dropped
 *
 * If a historical item is missing `category`, it defaults to "internal".
 * If a historical item is missing `blocksPublish`, it defaults to true
 * (the old default), so a recovered item never silently weakens its gate.
 *
 * Behaviour: OVERWRITES the current reviewItems array on each document
 * with the recovered set. Run with --dry-run first to inspect.
 *
 * Usage:
 *   pnpm --filter sanity exec tsx migrations/restore-review-items-migrate.ts --dataset development
 *   pnpm --filter sanity exec tsx migrations/restore-review-items-migrate.ts --dataset development --dry-run
 *   pnpm --filter sanity exec tsx migrations/restore-review-items-migrate.ts --at 2026-06-13T06:55:00Z
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
const atIndex = args.indexOf('--at');
const RECOVERY_TIME =
	(atIndex >= 0 ? args[atIndex + 1] : undefined) ?? '2026-06-13T06:55:00Z';

if (dataset === 'production') {
	console.error('Refusing to run against the production dataset.');
	process.exit(1);
}

const DOCUMENT_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;
const VALID_CATEGORIES = new Set([
	'price',
	'facts',
	'media',
	'location',
	'copy',
	'seo',
	'legal',
	'internal'
]);

type LegacyReviewItem = {
	_type?: string;
	_key?: string;
	label?: string;
	detail?: string;
	blocksPublish?: boolean;
	category?: string;
	// dropped fields from the pre-redesign schema:
	severity?: string;
	sourceLevel?: string;
	visibleToReviewer?: boolean;
};

type NewReviewItem = {
	_type: 'reviewItem';
	_key: string;
	label: string;
	detail?: string;
	blocksPublish: boolean;
	category: string;
};

type HistoricalDocument = {
	_id: string;
	_type: string;
	workflow?: {
		reviewItems?: LegacyReviewItem[];
	};
	reviewItems?: LegacyReviewItem[];
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

function randomKey(length = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function transformItem(legacy: LegacyReviewItem): NewReviewItem | null {
	if (!legacy.label || typeof legacy.label !== 'string') return null;
	const category =
		legacy.category && VALID_CATEGORIES.has(legacy.category) ? legacy.category : 'internal';
	return {
		_type: 'reviewItem',
		_key: legacy._key ?? randomKey(),
		label: legacy.label,
		...(legacy.detail ? { detail: legacy.detail } : {}),
		blocksPublish: typeof legacy.blocksPublish === 'boolean' ? legacy.blocksPublish : true,
		category
	};
}

async function fetchCurrentIds(client: SanityClient): Promise<string[]> {
	return client.fetch<string[]>(`*[_type in $types]._id`, { types: DOCUMENT_TYPES });
}

async function fetchAlreadyRestoredIds(client: SanityClient): Promise<Set<string>> {
	const ids = await client.fetch<string[]>(
		`*[_type in $types && defined(reviewItems) && count(reviewItems) > 0]._id`,
		{ types: DOCUMENT_TYPES }
	);
	return new Set(ids);
}

async function fetchHistorical(
	client: SanityClient,
	id: string,
	time: string
): Promise<HistoricalDocument | null> {
	try {
		const result = await client.request<{ documents: HistoricalDocument[] }>({
			uri: `/data/history/${dataset}/documents/${encodeURIComponent(id)}?time=${encodeURIComponent(
				time
			)}`,
			method: 'GET'
		});
		return result.documents?.[0] ?? null;
	} catch (error) {
		const message = (error as Error).message ?? String(error);
		// 404 is expected for documents that didn't exist at the cutoff time
		if (message.includes('404') || message.toLowerCase().includes('not found')) {
			return null;
		}
		throw error;
	}
}

type Recovery = {
	id: string;
	type: string;
	items: NewReviewItem[];
};

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
		`Restore reviewItems → ${PROJECT_ID}/${dataset} from ${RECOVERY_TIME}${dryRun ? ' (dry run)' : ''}`
	);

	const ids = await fetchCurrentIds(client);
	const alreadyRestored = await fetchAlreadyRestoredIds(client);
	const idsToInspect = ids.filter((id) => !alreadyRestored.has(id));
	console.log(
		`Scanning ${idsToInspect.length} document(s) for historical reviewItems (skipping ${alreadyRestored.size} already populated)…`
	);

	const recoveries: Recovery[] = [];
	let inspected = 0;
	for (const id of idsToInspect) {
		inspected += 1;
		if (inspected % 50 === 0) {
			console.log(`  …${inspected}/${idsToInspect.length} inspected`);
		}
		const historical = await fetchHistorical(client, id, RECOVERY_TIME);
		if (!historical) continue;
		const legacyItems =
			historical.workflow?.reviewItems ?? historical.reviewItems ?? [];
		if (!legacyItems.length) continue;
		const newItems = legacyItems
			.map(transformItem)
			.filter((item): item is NewReviewItem => item !== null);
		if (!newItems.length) continue;
		recoveries.push({ id, type: historical._type, items: newItems });
	}

	console.log(`Found ${recoveries.length} document(s) with recoverable review items.`);

	for (const recovery of recoveries) {
		console.log(
			`  ${recovery.type} ${recovery.id}: restore ${recovery.items.length} review item(s)`
		);
		if (dryRun) continue;
		await client.patch(recovery.id).set({ reviewItems: recovery.items }).commit();
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Restore complete.');
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
