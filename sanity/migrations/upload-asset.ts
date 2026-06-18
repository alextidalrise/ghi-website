#!/usr/bin/env node
/**
 * Upload a local image/file directly to Sanity and (optionally) attach it to a
 * document field — a reliable bypass for the in-Studio uploader.
 *
 * Uploading via `client.assets.upload()` performs the same content-addressed upload
 * Studio does, but server-side and in one shot, so it cannot leave a stuck `_upload`
 * placeholder behind. Use it to land an image that the Studio uploader keeps stalling
 * on, then either reference the printed asset id by hand or let this script set it.
 *
 * The asset is wrapped in a `mediaAssetMetadata` object to match the schema used by
 * gallery / thumbnailOverride / sharedGallery fields.
 *
 * Usage:
 *   # 1. Just upload and print the asset id (attach it yourself in Studio):
 *   pnpm --filter sanity upload-asset -- --dataset production --file "./Jack Nicklaus North - General View.jpg"
 *
 *   # 2. Append to an array image field (e.g. the development gallery — first image is the hero):
 *   pnpm --filter sanity upload-asset -- --dataset production \
 *     --file "./img.jpg" --doc <documentId> --field media.gallery --array --alt "Jack Nicklaus North general view"
 *
 *   # 3. Set a single-object image field (e.g. thumbnailOverride):
 *   pnpm --filter sanity upload-asset -- --dataset production \
 *     --file "./img.jpg" --doc <documentId> --field media.thumbnailOverride --alt "…"
 *
 * Notes:
 *   - --doc accepts a published id or a draft id (`drafts.<id>`). Set the field on the
 *     draft if you want to review/publish it from Studio afterwards.
 *   - Run `pnpm --filter sanity migrate:clear-stuck-uploads` first if the target doc is
 *     wedged by a previous stuck upload.
 */
import { createClient } from '@sanity/client';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { basename } from 'node:path';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = process.env.SANITY_STUDIO_PROJECT_ID ?? 's88o8sjb';
const TOKEN =
	process.env.SANITY_API_TOKEN ?? process.env.SANITY_AUTH_TOKEN ?? readSanityCliAuthToken();

const args = process.argv.slice(2);

function flag(name: string): string | undefined {
	const eq = args.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
	if (eq !== undefined) return eq;
	const idx = args.indexOf(`--${name}`);
	return idx >= 0 && args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : undefined;
}

const dataset = flag('dataset') ?? 'development';
const file = flag('file');
const docId = flag('doc');
const field = flag('field');
const isArray = args.includes('--array');
const alt = flag('alt');

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

function randomKey(): string {
	return Math.random().toString(36).slice(2, 14);
}

async function main() {
	if (!TOKEN) {
		console.error('Missing SANITY_API_TOKEN or Sanity CLI auth token (run `sanity login`).');
		process.exit(1);
	}
	if (!file || !existsSync(file)) {
		console.error(`File not found: ${file ?? '(missing --file)'}`);
		process.exit(1);
	}

	const client = createClient({
		projectId: PROJECT_ID,
		dataset,
		token: TOKEN,
		apiVersion: '2024-01-01',
		useCdn: false
	});

	const filename = basename(file);
	console.log(`Uploading ${filename} to ${dataset}…`);
	const asset = await client.assets.upload('image', createReadStream(file), { filename });
	console.log(`Uploaded. Asset id: ${asset._id}`);
	console.log(`  url: ${asset.url}`);

	if (!docId || !field) {
		console.log('\nNo --doc/--field given; not attaching. Reference the asset id above in Studio.');
		return;
	}

	const mediaItem: Record<string, unknown> = {
		_type: 'mediaAssetMetadata',
		asset: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
		...(alt ? { altText: alt } : {})
	};

	if (isArray) {
		mediaItem._key = randomKey();
		await client
			.patch(docId)
			.setIfMissing({ [field]: [] })
			.append(field, [mediaItem])
			.commit({ autoGenerateArrayKeys: false });
		console.log(`Appended image to ${docId}.${field}`);
	} else {
		await client.patch(docId).set({ [field]: mediaItem }).commit();
		console.log(`Set ${docId}.${field}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
