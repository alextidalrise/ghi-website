#!/usr/bin/env node
/**
 * Move legacy marketing copy from content.* to marketing.* and unset old keys.
 *
 * Maps:
 *   content.longDescription       → marketing.longFormDescription
 *   content.lifestyleDescription  → marketing.lifestyleAngle
 *   content.investmentDescription → marketing.investmentAngle
 *   content.buyerFitNotes         → marketing.audienceFit
 *
 * Usage:
 *   pnpm --filter sanity migrate:content-to-marketing -- --dataset development
 *   pnpm --filter sanity migrate:content-to-marketing:dry-run -- --dataset development
 */
import { createClient, type SanityClient } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const DOCUMENT_TYPES = ['propertyListing', 'development'] as const;

type PortableText = unknown;

type ContentLegacy = {
	longDescription?: PortableText;
	lifestyleDescription?: PortableText;
	investmentDescription?: PortableText;
	buyerFitNotes?: string | null;
};

type ListingDocument = {
	_id: string;
	_type: string;
	content?: ContentLegacy | null;
	marketing?: Record<string, unknown> | null;
};

const LEGACY_CONTENT_KEYS = [
	'longDescription',
	'lifestyleDescription',
	'investmentDescription',
	'buyerFitNotes'
] as const;

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
		const config = JSON.parse(readFileSync(configPath, 'utf8')) as {
			authToken?: string;
		};
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

function buildMarketingPatch(content: ContentLegacy, existing: Record<string, unknown> | null | undefined) {
	const marketing: Record<string, unknown> = { ...(existing ?? {}) };

	if (content.longDescription != null && marketing.longFormDescription == null) {
		marketing.longFormDescription = content.longDescription;
	}
	if (content.lifestyleDescription != null && marketing.lifestyleAngle == null) {
		marketing.lifestyleAngle = content.lifestyleDescription;
	}
	if (content.investmentDescription != null && marketing.investmentAngle == null) {
		marketing.investmentAngle = content.investmentDescription;
	}
	if (content.buyerFitNotes != null && content.buyerFitNotes !== '' && marketing.audienceFit == null) {
		marketing.audienceFit = content.buyerFitNotes;
	}

	return marketing;
}

function hasLegacyContent(content: ContentLegacy | null | undefined): boolean {
	if (!content) {
		return false;
	}

	return (
		content.longDescription != null ||
		content.lifestyleDescription != null ||
		content.investmentDescription != null ||
		(content.buyerFitNotes != null && content.buyerFitNotes !== '')
	);
}

async function main() {
	const client = createMigrationClient();
	const query = `*[
		_type in $types
		&& (
			defined(content.longDescription)
			|| defined(content.lifestyleDescription)
			|| defined(content.investmentDescription)
			|| defined(content.buyerFitNotes)
		)
	]{ _id, _type, content, marketing }`;

	const docs = await client.fetch<ListingDocument[]>(query, {
		types: DOCUMENT_TYPES
	});

	console.log(`Dataset: ${dataset}`);
	console.log(`Dry run: ${dryRun}`);
	console.log(`Documents with legacy content fields: ${docs.length}`);

	if (docs.length === 0) {
		return;
	}

	const transaction = client.transaction();

	for (const doc of docs) {
		const content = doc.content;
		if (!content || !hasLegacyContent(content)) {
			continue;
		}

		const marketing = buildMarketingPatch(content, doc.marketing);

		transaction.patch(doc._id, (patch) =>
			patch.set({ marketing }).unset(LEGACY_CONTENT_KEYS.map((key) => `content.${key}`))
		);

		if (dryRun) {
			const moved = LEGACY_CONTENT_KEYS.filter((key) => content[key] != null && content[key] !== '');
			console.log(`Would migrate ${doc._id} (${doc._type}): ${moved.join(', ')}`);
		}
	}

	if (dryRun) {
		return;
	}

	await transaction.commit();
	console.log(`Migrated marketing fields on ${docs.length} document(s).`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
