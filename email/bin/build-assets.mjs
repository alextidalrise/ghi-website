#!/usr/bin/env node
/**
 * Rasterise the brand logos into the PNG variants email needs.
 *
 * Email cannot use SVG: neither Outlook for Windows nor Gmail renders it, and
 * the site only ships SVG. Rather than hand-exporting PNGs in a design tool
 * (a manual-only step that a future agent could not reproduce, and that drifts
 * the moment the logo is revised), this script derives them from the same SVG
 * files the site uses.
 *
 * Output lands in `web/static/email/`, so the files are served from the brand
 * domain over HTTPS and are version-controlled alongside everything else.
 *
 *   node bin/build-assets.mjs
 *
 * Brand chrome (logo) is hosted statically here. CAMPAIGN imagery is different:
 * it goes through the Sanity CDN via lib/image-url.mjs. See
 * docs/01-technical-standard.md for why the two are split.
 */

import { readFile, mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

import { color } from '../lib/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const sourceDir = join(repoRoot, 'web', 'static', 'design-system', 'assets');
const outDir = join(repoRoot, 'web', 'static', 'email');

/**
 * The masthead logo is 200px wide on screen and rendered at 2x for retina.
 *
 * The source viewBox is 600x220 but the artwork does not fill it, so the render
 * is trimmed to the ink bounds first and the real aspect ratio is measured from
 * the result. Otherwise the wordmark sits optically smaller than its box and
 * the masthead's padding is partly baked into the image, where no one can
 * adjust it.
 */
const LOGO_DISPLAY_WIDTH = 200;

const targets = [
	{
		source: 'logo-white.svg',
		out: 'logo-ivory@2x.png',
		/*
		 * The site's "white" logo is pure #FFFFFF. On the green masthead the
		 * brand's light ink is --on-green ivory, so the fill is retinted here
		 * rather than shipping a colour the design system does not contain.
		 */
		recolor: { from: '#fff', to: color.onGreen },
		/*
		 * Flattened onto the green ground rather than left transparent. A
		 * transparent PNG inverted by a dark-mode client can leave light ink on
		 * a light ground; baking the ground in makes the logo immune.
		 */
		background: color.green
	},
	{
		source: 'logo-green.svg',
		out: 'logo-green-on-white@2x.png',
		background: color.white
	}
];

/**
 * Photography for the reference email.
 *
 * Deliberately static rather than Sanity-backed. The reference email is a
 * permanent QA fixture, and a fixture that depends on a specific CMS document
 * still existing is a fixture that breaks silently. Real campaigns take the
 * other path: buildEmailImageUrl() against the Sanity CDN, format pinned.
 *
 * Served at 2x the 600px slot and cropped to the brand's 3:2 card ratio.
 */
const photos = [
	{
		source: 'andalucia-golf-villa.png',
		out: 'reference-andalucia@2x.jpg',
		width: 1200,
		height: 800
	}
];

async function buildPhotos() {
	const results = [];

	for (const photo of photos) {
		const outPath = join(outDir, photo.out);

		await sharp(join(sourceDir, photo.source))
			.resize({ width: photo.width, height: photo.height, fit: 'cover', position: 'centre' })
			.jpeg({ quality: 78, progressive: true, mozjpeg: true })
			.toFile(outPath);

		const { size } = await stat(outPath);
		results.push({
			file: photo.out,
			width: photo.width,
			height: photo.height,
			displayWidth: photo.width / 2,
			displayHeight: photo.height / 2,
			bytes: size
		});
	}

	return results;
}

async function main() {
	await mkdir(outDir, { recursive: true });

	const width = LOGO_DISPLAY_WIDTH * 2;
	const results = [];
	let measuredHeight = null;

	for (const target of targets) {
		let svg = await readFile(join(sourceDir, target.source), 'utf8');

		if (target.recolor) {
			svg = svg.replaceAll(target.recolor.from, target.recolor.to);
		}

		const outPath = join(outDir, target.out);

		// Trim the empty margin baked into the source viewBox, then scale the
		// remaining artwork to the target width.
		const trimmed = await sharp(Buffer.from(svg), { density: 384 })
			.trim({ threshold: 1 })
			.toBuffer();

		const info = await sharp(trimmed)
			.resize({ width })
			.flatten({ background: target.background })
			.png({ compressionLevel: 9, palette: true })
			.toFile(outPath);

		if (measuredHeight === null) measuredHeight = info.height;

		if (info.height !== measuredHeight) {
			throw new Error(
				`Logo variants disagree on aspect ratio (${target.out} is ${info.width}x${info.height}, ` +
					`expected height ${measuredHeight}). They must be interchangeable.`
			);
		}

		const { size } = await stat(outPath);
		results.push({ file: target.out, width: info.width, height: info.height, bytes: size });
	}

	const photoResults = await buildPhotos();

	// A manifest so the templates and the validator agree on dimensions
	// without anyone re-measuring a PNG by hand.
	const manifest = {
		generatedFrom: 'web/static/design-system/assets/',
		logo: {
			displayWidth: LOGO_DISPLAY_WIDTH,
			displayHeight: Math.round(measuredHeight / 2)
		},
		files: [...results, ...photoResults]
	};

	await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);

	for (const r of manifest.files) {
		console.log(`  ${r.file}  ${r.width}x${r.height}  ${(r.bytes / 1024).toFixed(1)}KB`);
	}
	console.log(`\n  Logo display size: ${manifest.logo.displayWidth}x${manifest.logo.displayHeight}`);
	console.log(`  Written to web/static/email/`);

	const extras = await readdir(outDir);
	const managed = new Set([...targets.map((t) => t.out), ...photos.map((p) => p.out)]);
	const orphans = extras.filter((f) => f !== 'manifest.json' && !managed.has(f));
	if (orphans.length) {
		console.warn(`\n  Unmanaged files in web/static/email/: ${orphans.join(', ')}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
