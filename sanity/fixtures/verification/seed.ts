#!/usr/bin/env node
/**
 * Seed verification privacy fixtures into the Sanity development dataset.
 *
 * Requires SANITY_API_TOKEN with write access. Creates the development dataset
 * if it does not exist.
 *
 * Usage:
 *   SANITY_API_TOKEN=... pnpm --filter sanity fixtures:seed
 *   SANITY_API_TOKEN=... pnpm --filter sanity fixtures:seed -- --dry-run
 */
import { createClient, type IdentifiedSanityDocumentStub } from '@sanity/client';
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import {
	FIXTURE_ASSET_TAGS,
	FIXTURE_GHI_IDS,
	FIXTURE_SLUGS,
	VERIFICATION_DATASET
} from './constants';
import {
	buildGoldenProperty,
	buildLocationDocuments,
	buildMediaPrivacyProperty,
	buildPrivacyDevelopmentStub,
	buildPrivacyDevelopmentUnits,
	buildPrivacyDevelopmentWithUnits,
	type UploadedAssets
} from './documents';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN = process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();
const dryRun = process.argv.includes('--dry-run');

function readSanityCliAuthToken(): string | undefined {
	const configPath = join(homedir(), '.config/sanity/config.json');
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

const IMAGE_SOURCE = join(
	__dirname,
	'../../../web/static/design-system/assets/andalucia-golf-villa.png'
);

function ensureDevelopmentDataset() {
	const datasets = execSync('pnpm exec sanity dataset list', {
		cwd: join(__dirname, '../..'),
		encoding: 'utf8'
	});
	if (!datasets.split('\n').some((line) => line.trim() === VERIFICATION_DATASET)) {
		console.log(`Creating ${VERIFICATION_DATASET} dataset…`);
		if (!dryRun) {
			execSync(`pnpm exec sanity dataset create ${VERIFICATION_DATASET} --visibility public`, {
				cwd: join(__dirname, '../..'),
				stdio: 'inherit'
			});
		}
	}
}

async function uploadTaggedAssets(client: ReturnType<typeof createClient>): Promise<UploadedAssets> {
	const buffer = readFileSync(IMAGE_SOURCE);
	const uploaded: Partial<UploadedAssets> = {};

	for (const tag of Object.values(FIXTURE_ASSET_TAGS)) {
		if (dryRun) {
			uploaded[tag] = `image-dry-run-${tag}`;
			continue;
		}

		const asset = await client.assets.upload('image', buffer, {
			filename: `${tag}.png`,
			label: tag
		});
		uploaded[tag] = asset._id;
		console.log(`  uploaded ${tag} → ${asset._id}`);
	}

	return uploaded as UploadedAssets;
}

async function main() {
	console.log(`Verification fixtures → ${PROJECT_ID}/${VERIFICATION_DATASET}${dryRun ? ' (dry run)' : ''}`);

	if (!TOKEN && !dryRun) {
		console.error(
			'Missing write credentials. Either:\n' +
				'  • export SANITY_API_TOKEN=… (token with write access), or\n' +
				'  • run `pnpm exec sanity login` so the CLI auth token is available\n' +
				'Then re-run: pnpm --filter sanity fixtures:seed'
		);
		process.exit(1);
	}

	if (!process.env.SANITY_API_TOKEN) {
		ensureDevelopmentDataset();
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset: VERIFICATION_DATASET,
		apiVersion: '2025-05-01',
		token: TOKEN,
		useCdn: false
	});

	console.log('Uploading fixture image assets…');
	const assets = await uploadTaggedAssets(client);

	const documents: IdentifiedSanityDocumentStub[] = [
		...buildLocationDocuments(),
		buildGoldenProperty(assets),
		buildPrivacyDevelopmentStub(assets),
		...buildPrivacyDevelopmentUnits(),
		buildPrivacyDevelopmentWithUnits(assets),
		buildMediaPrivacyProperty(assets)
	];
	console.log(`Upserting ${documents.length} documents…`);

	for (const doc of documents) {
		if (dryRun) {
			console.log(`  [dry-run] ${doc._type} ${doc._id}`);
			continue;
		}
		await client.createOrReplace(doc);
		console.log(`  ✓ ${doc._type} ${doc._id}`);
	}

	console.log('\nFixture URLs (development dataset, after web dev server is running):');
	const base = `/${FIXTURE_SLUGS.country}/${FIXTURE_SLUGS.location}/${FIXTURE_SLUGS.community}`;
	console.log(`  1. Golden property:  ${base}/${FIXTURE_SLUGS.goldenProperty}`);
	console.log(`  2. Privacy units:    ${base}/${FIXTURE_SLUGS.privacyDevelopment}`);
	console.log(`  3. Media privacy:    ${base}/${FIXTURE_SLUGS.mediaPrivacyProperty}`);
	console.log('\nGHI permalinks:');
	console.log(`  /p/${FIXTURE_GHI_IDS.goldenProperty}`);
	console.log(`  /d/${FIXTURE_GHI_IDS.privacyDevelopment}`);
	console.log(`  /p/${FIXTURE_GHI_IDS.mediaPrivacyProperty}`);
	console.log('\nSee sanity/fixtures/verification/CHECKLIST.md for manual verification steps.');
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
