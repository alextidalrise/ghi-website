#!/usr/bin/env node
/**
 * Migrate legacy workflow.factsNeedingConfirmation and missingSourceFields
 * into structured workflow.reviewItems.
 *
 * Usage:
 *   pnpm --filter sanity migrate:review-items -- --dataset development
 *   pnpm --filter sanity migrate:review-items -- --dataset development --dry-run
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;

type ReviewItem = {
	_type: 'reviewItem';
	_key: string;
	label: string;
	severity: 'must_check' | 'nice_to_check' | 'internal_note';
	sourceLevel: 'window_card' | 'brochure' | 'source_folder' | 'deep_audit' | 'derived';
	visibleToReviewer: boolean;
	blocksPublish: boolean;
	category: 'price' | 'facts' | 'media' | 'location' | 'copy' | 'seo' | 'legal' | 'internal';
};

type WorkflowFields = {
	factsNeedingConfirmation?: string[];
	missingSourceFields?: string[];
	reviewItems?: ReviewItem[];
};

type DocumentWithWorkflow = {
	_id: string;
	_type: string;
	workflow?: WorkflowFields;
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

function randomKey(length = 12): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

function mapLegacyFacts(facts: string[]): ReviewItem[] {
	return facts.map((label) => ({
		_type: 'reviewItem',
		_key: randomKey(),
		label,
		severity: 'must_check',
		sourceLevel: 'derived',
		visibleToReviewer: true,
		blocksPublish: true,
		category: 'facts'
	}));
}

function mapLegacyMissingFields(fields: string[]): ReviewItem[] {
	return fields.map((label) => ({
		_type: 'reviewItem',
		_key: randomKey(),
		label,
		severity: 'nice_to_check',
		sourceLevel: 'source_folder',
		visibleToReviewer: true,
		blocksPublish: false,
		category: 'facts'
	}));
}

async function fetchDocuments(client: SanityClient): Promise<DocumentWithWorkflow[]> {
	return client.fetch<DocumentWithWorkflow[]>(
		`*[_type in $types && defined(workflow)]{
			_id,
			_type,
			workflow{
				factsNeedingConfirmation,
				missingSourceFields,
				reviewItems
			}
		}`,
		{ types: DOCUMENT_TYPES }
	);
}

function needsMigration(doc: DocumentWithWorkflow): boolean {
	const workflow = doc.workflow;
	if (!workflow) return false;

	const facts = workflow.factsNeedingConfirmation ?? [];
	const missing = workflow.missingSourceFields ?? [];
	return facts.length > 0 || missing.length > 0;
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
	const toMigrate = documents.filter(needsMigration);

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);
	console.log(`Found ${toMigrate.length} document(s) with legacy review strings.`);

	for (const doc of toMigrate) {
		const workflow = doc.workflow!;
		const existingItems = workflow.reviewItems ?? [];
		const newItems = [
			...existingItems,
			...mapLegacyFacts(workflow.factsNeedingConfirmation ?? []),
			...mapLegacyMissingFields(workflow.missingSourceFields ?? [])
		];

		console.log(`  ${doc._type} ${doc._id}: +${newItems.length - existingItems.length} review item(s)`);

		if (dryRun) continue;

		await client
			.patch(doc._id)
			.set({
				'workflow.reviewItems': newItems,
				'workflow.factsNeedingConfirmation': [],
				'workflow.missingSourceFields': []
			})
			.commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Migration complete.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
