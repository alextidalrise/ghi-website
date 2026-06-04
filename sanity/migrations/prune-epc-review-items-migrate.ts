#!/usr/bin/env node
/**
 * Remove workflow review items and legacy strings about EPC / energy performance certificates.
 * Also strips matching lines from workflow.approvalNotes when present.
 *
 * Usage:
 *   pnpm --filter sanity migrate:prune-epc-review-items -- --dataset development
 *   pnpm --filter sanity migrate:prune-epc-review-items:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;

const EPC_PATTERN = /\bepc\b|energy performance certificate|energy performance cert/i;

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
	approvalNotes?: string;
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
	const configPath = join(homedir(), '.config', 'sanity', 'config.json');
	if (!existsSync(configPath)) return undefined;
	try {
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as { authToken?: string };
		return config.authToken;
	} catch {
		return undefined;
	}
}

function matchesEpc(text: string): boolean {
	return EPC_PATTERN.test(text);
}

function shouldRemoveReviewItem(item: ReviewItem): boolean {
	const label = item.label ?? '';
	const detail = item.detail ?? '';
	return matchesEpc(label) || matchesEpc(detail);
}

function shouldRemoveLegacyString(value: string): boolean {
	return matchesEpc(value);
}

function stripEpcLines(notes: string): string {
	const lines = notes.split('\n');
	const kept = lines.filter((line) => !matchesEpc(line));
	return kept.join('\n').trim();
}

function pruneWorkflow(workflow: WorkflowFields): {
	next: WorkflowFields;
	removedLabels: string[];
	removedLegacy: string[];
	approvalNotesStripped: boolean;
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

	let approvalNotesStripped = false;
	let nextApprovalNotes = workflow.approvalNotes;
	if (typeof workflow.approvalNotes === 'string' && matchesEpc(workflow.approvalNotes)) {
		nextApprovalNotes = stripEpcLines(workflow.approvalNotes);
		approvalNotesStripped = nextApprovalNotes !== workflow.approvalNotes.trim();
	}

	const changed =
		nextReviewItems.length !== reviewItems.length ||
		nextFacts.length !== facts.length ||
		nextMissing.length !== missing.length ||
		approvalNotesStripped;

	return {
		next: {
			...workflow,
			reviewItems: nextReviewItems,
			factsNeedingConfirmation: nextFacts,
			missingSourceFields: nextMissing,
			...(approvalNotesStripped ? { approvalNotes: nextApprovalNotes || undefined } : {})
		},
		removedLabels,
		removedLegacy,
		approvalNotesStripped,
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
				reviewItems,
				approvalNotes
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
		approvalNotesStripped: boolean;
		next: WorkflowFields;
	}> = [];

	for (const doc of documents) {
		const workflow = doc.workflow;
		if (!workflow) continue;

		const { next, removedLabels, removedLegacy, approvalNotesStripped, changed } =
			pruneWorkflow(workflow);
		if (changed) {
			toPrune.push({ doc, removedLabels, removedLegacy, approvalNotesStripped, next });
		}
	}

	console.log(`Dataset: ${dataset}${dryRun ? ' (dry run)' : ''}`);
	console.log(`Found ${toPrune.length} document(s) with EPC-related workflow content.`);

	for (const { doc, removedLabels, removedLegacy, approvalNotesStripped, next } of toPrune) {
		const idLabel = doc.ghiListingId ?? doc.title ?? doc._id;
		console.log(`  ${doc._type} ${doc._id} (${idLabel}):`);
		for (const label of removedLabels) {
			console.log(`    - review item: ${label}`);
		}
		for (const legacy of removedLegacy) {
			console.log(`    - legacy string: ${legacy}`);
		}
		if (approvalNotesStripped) {
			console.log('    - stripped EPC lines from approvalNotes');
		}

		if (dryRun) continue;

		const patch = client.patch(doc._id).set({
			'workflow.reviewItems': next.reviewItems ?? [],
			'workflow.factsNeedingConfirmation': next.factsNeedingConfirmation ?? [],
			'workflow.missingSourceFields': next.missingSourceFields ?? []
		});

		if (approvalNotesStripped) {
			if (next.approvalNotes) {
				patch.set({ 'workflow.approvalNotes': next.approvalNotes });
			} else {
				patch.unset(['workflow.approvalNotes']);
			}
		}

		await patch.commit({ autoGenerateArrayKeys: false });
	}

	console.log(dryRun ? 'Dry run complete — no changes written.' : 'Prune complete.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
