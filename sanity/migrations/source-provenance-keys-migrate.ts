#!/usr/bin/env node
/**
 * Backfill missing `_key` values on sourceProvenance array items.
 *
 * Sanity Studio cannot edit array fields when items are missing keys. This
 * usually happens when documents are created via the API without `_key` on each
 * array entry. Use autoGenerateArrayKeys on writes, or run this migration.
 *
 * Usage:
 *   pnpm --filter sanity migrate:source-provenance-keys -- --dataset development
 *   pnpm --filter sanity migrate:source-provenance-keys -- --dataset development --dry-run
 *   pnpm --filter sanity migrate:source-provenance-keys -- --dataset development --id ghi00046-casa-la-colina-review-only
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;

type SourceProvenanceItem = {
	_type?: string;
	_key?: string;
	[key: string]: unknown;
};

type DocumentWithProvenance = {
	_id: string;
	_type: string;
	title?: string;
	sourceProvenance?: SourceProvenanceItem[];
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const idArg = args.find((arg) => arg.startsWith('--id='))?.split('=')[1];
const idIndex = args.indexOf('--id');
const documentId = idArg ?? (idIndex >= 0 ? args[idIndex + 1] : undefined);
const datasetArg = args.find((arg) => arg.startsWith('--dataset='))?.split('=')[1];
const datasetIndex = args.indexOf('--dataset');
const dataset =
	datasetArg ?? (datasetIndex >= 0 ? args[datasetIndex + 1] : undefined) ?? 'development';

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

function ensureUniqueKeys(items: SourceProvenanceItem[]): {
	next: SourceProvenanceItem[];
	added: number;
} {
	const used = new Set<string>();
	let added = 0;

	const next = items.map((item) => {
		const existingKey = item._key?.trim();
		if (existingKey) {
			used.add(existingKey);
			return item;
		}

		let key = randomKey();
		while (used.has(key)) key = randomKey();
		used.add(key);
		added += 1;
		return { ...item, _key: key };
	});

	return { next, added };
}

function needsMigration(doc: DocumentWithProvenance): boolean {
	const items = doc.sourceProvenance ?? [];
	return items.some((item) => !item._key?.trim());
}

async function fetchDocuments(client: SanityClient): Promise<DocumentWithProvenance[]> {
	if (documentId) {
		const doc = await client.fetch<DocumentWithProvenance | null>(
			`*[_id in [$id, $draftId]][0]{
				_id,
				_type,
				title,
				sourceProvenance
			}`,
			{ id: documentId, draftId: `drafts.${documentId}` }
		);
		return doc ? [doc] : [];
	}

	return client.fetch<DocumentWithProvenance[]>(
		`*[_type in $types && defined(sourceProvenance) && count(sourceProvenance[!defined(_key) || _key == ""]) > 0]{
			_id,
			_type,
			title,
			sourceProvenance
		}`,
		{ types: DOCUMENT_TYPES }
	);
}

async function main() {
	if (!TOKEN) {
		console.error('Missing SANITY_API_TOKEN or Sanity CLI auth token.');
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false,
		perspective: 'raw'
	});

	const documents = await fetchDocuments(client);
	const toMigrate = documents.filter(needsMigration);

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);
	if (documentId) {
		console.log(`Document filter: ${documentId}`);
		if (documents.length === 0) {
			console.error(`No document found with id "${documentId}" (checked published + draft).`);
			process.exit(1);
		}
	}
	console.log(`Found ${toMigrate.length} document(s) with missing sourceProvenance keys.`);

	for (const doc of toMigrate) {
		const { next, added } = ensureUniqueKeys(doc.sourceProvenance ?? []);
		const label = doc.title ? `${doc._id} (${doc.title})` : doc._id;
		console.log(`  ${doc._type} ${label}: +${added} key(s)`);

		if (dryRun) continue;

		await client
			.patch(doc._id)
			.set({ sourceProvenance: next })
			.commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
