#!/usr/bin/env node
/**
 * Remove obsolete workflow review items about media rights, public-use approval,
 * aerial privacy, and full-resolution gallery privacy checks.
 *
 * Also strips matching strings from legacy factsNeedingConfirmation /
 * missingSourceFields so review-items-migrate cannot re-introduce them.
 *
 * Usage:
 *   pnpm --filter sanity migrate:prune-media-privacy-review-items -- --dataset development
 *   pnpm --filter sanity migrate:prune-media-privacy-review-items:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;

/** Known intake labels — removed exactly (case-insensitive). */
const EXACT_LABELS = [
	'Approve media rights and public-use status',
	'Check full-resolution gallery and aerial privacy'
] as const;

/** Substrings that identify obsolete media-rights / aerial-privacy review items. */
const LABEL_SUBSTRINGS = [
	'aerial privacy',
	'media rights',
	'public-use status',
	'public use status',
	'public-use media',
	'public use media',
	'visual suitability is not rights approval',
	'approve photos and any public-use media',
	'aerial/drone privacy',
	'aerial privacy/context',
	'visible-person/aerial privacy',
	'media rights/public-use',
	'media rights approval'
] as const;

type ReviewItem = {
	_type?: string;
	_key?: string;
	label?: string;
	detail?: string;
	[key: string]: unknown;
};

type WorkflowFields = {
	factsNeedingConfirmation?: string[];
	missingSourceFields?: string[];
	reviewItems?: ReviewItem[];
};

type DocumentWithWorkflow = {
	_id: string;
	_type: string;
	ghiListingId?: string;
	title?: string;
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

function normalize(text: string): string {
	return text.trim().toLowerCase();
}

function matchesExactLabel(label: string): boolean {
	const n = normalize(label);
	return EXACT_LABELS.some((exact) => normalize(exact) === n);
}

function matchesSubstring(text: string): boolean {
	const n = normalize(text);
	return LABEL_SUBSTRINGS.some((sub) => n.includes(sub));
}

function matchesFullResolutionGalleryPrivacy(text: string): boolean {
	const n = normalize(text);
	return n.includes('full-resolution gallery') && (n.includes('aerial') || n.includes('privacy'));
}

function shouldRemoveReviewItem(item: ReviewItem): boolean {
	const label = item.label ?? '';
	const detail = item.detail ?? '';
	const combined = `${label} ${detail}`;

	if (matchesExactLabel(label)) return true;
	if (matchesSubstring(label) || matchesSubstring(detail)) return true;
	if (matchesFullResolutionGalleryPrivacy(combined)) return true;

	return false;
}

function shouldRemoveLegacyString(value: string): boolean {
	if (matchesExactLabel(value)) return true;
	if (matchesSubstring(value)) return true;
	if (matchesFullResolutionGalleryPrivacy(value)) return true;
	return false;
}

function pruneWorkflow(workflow: WorkflowFields): {
	next: WorkflowFields;
	removedLabels: string[];
	removedLegacy: string[];
	changed: boolean;
} {
	const removedLabels: string[] = [];
	const removedLegacy: string[] = [];

	const reviewItems = workflow.reviewItems ?? [];
	const nextReviewItems = reviewItems.filter((item) => {
		if (shouldRemoveReviewItem(item)) {
			if (item.label) removedLabels.push(item.label);
			return false;
		}
		return true;
	});

	const facts = workflow.factsNeedingConfirmation ?? [];
	const nextFacts = facts.filter((s) => {
		if (shouldRemoveLegacyString(s)) {
			removedLegacy.push(s);
			return false;
		}
		return true;
	});

	const missing = workflow.missingSourceFields ?? [];
	const nextMissing = missing.filter((s) => {
		if (shouldRemoveLegacyString(s)) {
			removedLegacy.push(s);
			return false;
		}
		return true;
	});

	const changed =
		nextReviewItems.length !== reviewItems.length ||
		nextFacts.length !== facts.length ||
		nextMissing.length !== missing.length;

	return {
		next: {
			...workflow,
			reviewItems: nextReviewItems,
			factsNeedingConfirmation: nextFacts,
			missingSourceFields: nextMissing
		},
		removedLabels,
		removedLegacy,
		changed
	};
}

async function fetchDocuments(client: SanityClient): Promise<DocumentWithWorkflow[]> {
	return client.fetch<DocumentWithWorkflow[]>(
		`*[_type in $types && defined(workflow)]{
			_id,
			_type,
			ghiListingId,
			title,
			workflow{
				factsNeedingConfirmation,
				missingSourceFields,
				reviewItems
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
	const toPrune: Array<{
		doc: DocumentWithWorkflow;
		removedLabels: string[];
		removedLegacy: string[];
		next: WorkflowFields;
	}> = [];

	for (const doc of documents) {
		const workflow = doc.workflow;
		if (!workflow) continue;

		const { next, removedLabels, removedLegacy, changed } = pruneWorkflow(workflow);
		if (changed) {
			toPrune.push({ doc, removedLabels, removedLegacy, next });
		}
	}

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);
	console.log(`Found ${toPrune.length} document(s) with obsolete media/privacy review items.`);

	for (const { doc, removedLabels, removedLegacy, next } of toPrune) {
		const idLabel = doc.ghiListingId ?? doc.title ?? doc._id;
		console.log(`  ${doc._type} ${doc._id} (${idLabel}):`);
		for (const label of removedLabels) {
			console.log(`    - review item: ${label}`);
		}
		for (const legacy of removedLegacy) {
			console.log(`    - legacy string: ${legacy}`);
		}

		if (dryRun) continue;

		await client
			.patch(doc._id)
			.set({
				'workflow.reviewItems': next.reviewItems ?? [],
				'workflow.factsNeedingConfirmation': next.factsNeedingConfirmation ?? [],
				'workflow.missingSourceFields': next.missingSourceFields ?? []
			})
			.commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Prune complete.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
