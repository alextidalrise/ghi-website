#!/usr/bin/env node
/**
 * Migrate similar-properties fields from seo.* to related.* on propertyListing and development docs.
 *
 * Usage:
 *   pnpm --filter sanity migrate:related-content -- --dataset development
 *   pnpm --filter sanity migrate:related-content -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development'] as const;

type SeoSimilarFields = {
	similarPropertiesMode?: string;
	manualSimilarProperties?: unknown[];
	similarityTags?: string[];
};

type RelatedFields = {
	similarPropertiesMode?: string;
	manualSimilarProperties?: unknown[];
	similarityTags?: string[];
};

type DocumentWithSimilarFields = {
	_id: string;
	_type: string;
	seo?: SeoSimilarFields | null;
	related?: RelatedFields | null;
};

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
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

function hasLegacySimilarFields(seo?: SeoSimilarFields | null): boolean {
	if (!seo) return false;
	return (
		seo.similarPropertiesMode != null ||
		(seo.manualSimilarProperties?.length ?? 0) > 0 ||
		(seo.similarityTags?.length ?? 0) > 0
	);
}

function buildRelatedPatch(doc: DocumentWithSimilarFields): RelatedFields | null {
	const seo = doc.seo;
	if (!hasLegacySimilarFields(seo)) {
		return null;
	}

	const related: RelatedFields = { ...(doc.related ?? {}) };

	if (related.similarPropertiesMode == null && seo?.similarPropertiesMode != null) {
		related.similarPropertiesMode = seo.similarPropertiesMode;
	}
	if (
		(related.manualSimilarProperties?.length ?? 0) === 0 &&
		(seo?.manualSimilarProperties?.length ?? 0) > 0
	) {
		related.manualSimilarProperties = seo!.manualSimilarProperties;
	}
	if ((related.similarityTags?.length ?? 0) === 0 && (seo?.similarityTags?.length ?? 0) > 0) {
		related.similarityTags = seo!.similarityTags;
	}

	return related;
}

async function fetchDocuments(client: SanityClient): Promise<DocumentWithSimilarFields[]> {
	return client.fetch<DocumentWithSimilarFields[]>(
		`*[_type in $types && defined(seo) && (
			defined(seo.similarPropertiesMode)
			|| count(seo.manualSimilarProperties) > 0
			|| count(seo.similarityTags) > 0
		)]{
			_id,
			_type,
			seo{
				similarPropertiesMode,
				manualSimilarProperties,
				similarityTags
			},
			related{
				similarPropertiesMode,
				manualSimilarProperties,
				similarityTags
			}
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
		useCdn: false
	});

	const documents = await fetchDocuments(client);

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);
	console.log(`Found ${documents.length} document(s) with legacy seo.similar* fields.`);

	for (const doc of documents) {
		const related = buildRelatedPatch(doc);
		if (!related) {
			console.log(`  ${doc._type} ${doc._id}: skip (nothing to migrate)`);
			continue;
		}

		console.log(`  ${doc._type} ${doc._id}: migrate similar fields → related`);

		if (dryRun) continue;

		await client
			.patch(doc._id)
			.set({ related })
			.unset([
				'seo.similarPropertiesMode',
				'seo.manualSimilarProperties',
				'seo.similarityTags'
			])
			.commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
