#!/usr/bin/env node
/**
 * Pre-flight visual QA.
 *
 * Renders every built email in the conditions that break email layouts, and
 * writes a contact sheet of PNGs plus an index.html for review.
 *
 *   node bin/qa-screens.mjs                    # build_production
 *   node bin/qa-screens.mjs --dir build_local
 *   node bin/qa-screens.mjs --only reference
 *
 * WHAT THIS IS
 *   A fast, free, repeatable first pass that catches the majority of layout
 *   defects before anyone spends an Inbox Preview token or a testing-service
 *   credit. It runs on every release (docs/05-release-process.md).
 *
 * WHAT THIS IS NOT
 *   A substitute for real client testing. Chromium is a reasonable proxy for
 *   Apple Mail and Gmail web, both of which are standards-based renderers. It
 *   tells you NOTHING about:
 *
 *     - classic Outlook for Windows (Word's engine; no media queries, its own
 *       box model, and the reason half the markup in this system exists)
 *     - Gmail's CSS filtering, which strips rules Chromium honours
 *     - forced dark-mode inversion on Gmail Android and Outlook.com, which
 *       transform colours rather than reading prefers-color-scheme
 *
 *   Those need the client matrix in docs/04-qa-plan.md. A clean run here means
 *   "worth testing properly", never "passes".
 */

import { readdir, readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

import { layout } from '../lib/tokens.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const args = process.argv.slice(2);
const flag = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const sourceDir = resolve(root, flag('dir', 'build_production'));
const outDir = resolve(root, 'qa', 'screens');
const only = flag('only', null);

/**
 * Each scenario maps to an acceptance criterion in the brief. The comment on
 * each one is the question the screenshot is meant to answer.
 */
const scenarios = [
	{
		id: 'desktop-light',
		label: 'Desktop, 600px, light',
		width: 700,
		colorScheme: 'light',
		question: 'Does the intended design render at full column width?'
	},
	{
		id: 'desktop-dark',
		label: 'Desktop, 600px, dark',
		width: 700,
		colorScheme: 'dark',
		question: 'Do the dm-* rules apply, and do the green bookends hold?'
	},
	{
		id: 'mobile-light',
		label: 'Mobile, 375px, light',
		width: 375,
		colorScheme: 'light',
		question: 'Does the media query tighten gutters and step display type down?'
	},
	{
		id: 'mobile-dark',
		label: 'Mobile, 375px, dark',
		width: 375,
		colorScheme: 'dark',
		question: 'Is anything unreadable where dark mode and mobile combine?'
	},
	{
		id: 'narrow-320',
		label: 'Narrow, 320px',
		width: 320,
		colorScheme: 'light',
		question: 'Any horizontal scrolling? Long words breaking the column?'
	},
	{
		id: 'images-blocked',
		label: 'Images blocked, 600px',
		width: 700,
		colorScheme: 'light',
		blockImages: true,
		question: 'Is the email still understandable? Is alt text styled, not raw?'
	},
	{
		id: 'no-media-queries',
		label: 'Media queries stripped, 375px',
		width: 375,
		colorScheme: 'light',
		stripMediaQueries: true,
		question: 'Does it stay readable when a client drops the <style> block?'
	},
	{
		id: 'enlarged-200',
		label: '200% text, 375px',
		width: 375,
		colorScheme: 'light',
		textScale: 2,
		question: 'Does content overlap or truncate when text is doubled?'
	}
];

async function main() {
	await rm(outDir, { recursive: true, force: true });
	await mkdir(outDir, { recursive: true });

	const files = (await readdir(sourceDir)).filter(
		(f) => f.endsWith('.html') && (!only || basename(f, '.html') === only)
	);

	if (!files.length) {
		console.error(`No built templates in ${sourceDir}. Run \`pnpm build\` first.`);
		process.exit(1);
	}

	const browser = await chromium.launch();
	const shots = [];

	for (const file of files) {
		const name = basename(file, '.html');
		const html = await readFile(join(sourceDir, file), 'utf8');

		for (const scenario of scenarios) {
			const context = await browser.newContext({
				viewport: { width: scenario.width, height: 900 },
				/* 1x for the enlarged run so the capture stays inside Chromium's limit. */
				deviceScaleFactor: scenario.textScale ? 1 : 2,
				colorScheme: scenario.colorScheme,
				/*
				 * Emulates the reader who has raised their browser or OS text
				 * size, which the older, affluent audience PRODUCT.md describes
				 * is more likely than average to have done.
				 */
				...(scenario.textScale ? { reducedMotion: 'reduce' } : {})
			});

			/*
			 * Serve brand assets from disk rather than the live site.
			 *
			 * The built HTML points at https://www.golfhomesinternational.com/email/...
			 * because that is what has to ship. During QA those files may not be
			 * deployed yet, and testing against the currently-live copy would
			 * check the wrong version. This intercepts them and fulfils from
			 * web/static/email/, so the screenshots show the assets about to be
			 * released. Anything else still goes to the network.
			 */
			await context.route('**/email/*.{png,jpg,jpeg,gif}', async (route) => {
				const url = new URL(route.request().url());
				const local = join(root, '..', 'web', 'static', url.pathname);

				try {
					const body = await readFile(local);
					const ext = url.pathname.split('.').pop().toLowerCase();
					await route.fulfill({
						status: 200,
						contentType: ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg',
						body
					});
				} catch {
					// Not on disk either: let it fail as it would in an inbox.
					await route.continue();
				}
			});

			if (scenario.blockImages) {
				await context.route('**/*', (route) =>
					route.request().resourceType() === 'image' ? route.abort() : route.continue()
				);
			}

			const page = await context.newPage();

			let content = html;

			if (scenario.stripMediaQueries) {
				// Crudely remove @media blocks, the way a filtering client would.
				content = content.replace(/@media[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
			}

			await page.setContent(content, { waitUntil: 'networkidle' });

			if (scenario.textScale) {
				/*
				 * Emulates a reader who has raised their client's text size: the
				 * type grows, the 600px column does not.
				 *
				 * Computed sizes are read for every element FIRST and absolute
				 * pixel values written back second. Setting `font-size: 2em`
				 * instead would compound down every level of nested table, so a
				 * cell three tables deep would render at 8x and report a
				 * spectacular overflow that no real client would ever produce.
				 */
				await page.evaluate((factor) => {
					const nodes = [...document.querySelectorAll('td, p, h1, h2, h3, a, span, div')];
					const sizes = nodes.map((n) => parseFloat(getComputedStyle(n).fontSize));

					nodes.forEach((node, i) => {
						if (!Number.isFinite(sizes[i])) return;
						node.style.setProperty('font-size', `${sizes[i] * factor}px`, 'important');
						node.style.setProperty('line-height', '1.5', 'important');
					});
				}, scenario.textScale);
			}

			const outFile = `${name}--${scenario.id}.png`;

			/*
			 * Chromium refuses to capture beyond ~16,384 device pixels. A long
			 * email at 2x device scale with text doubled clears that easily, and
			 * the failure mode is an unhelpful protocol error rather than a
			 * short screenshot. Clip instead: the top of the email is where
			 * enlargement defects show up anyway.
			 */
			const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
			const maxCssHeight = Math.floor(15000 / (scenario.textScale ? 1 : 2));

			await page.screenshot({
				path: join(outDir, outFile),
				...(pageHeight > maxCssHeight
					? { clip: { x: 0, y: 0, width: scenario.width, height: maxCssHeight } }
					: { fullPage: true })
			});

			// Horizontal overflow is the single most common email layout defect,
			// and it is measurable rather than a matter of opinion.
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);

			shots.push({ name, scenario, file: outFile, overflow });

			const flagText = overflow > 1 ? `  OVERFLOW +${overflow}px` : '';
			console.log(`  ${outFile}${flagText}`);

			await context.close();
		}
	}

	await browser.close();
	await writeIndex(shots);

	const overflowing = shots.filter((s) => s.overflow > 1);

	console.log(`\n  ${shots.length} screenshots in qa/screens/`);
	console.log(`  Contact sheet: qa/screens/index.html`);

	if (overflowing.length) {
		console.error(`\n  ${overflowing.length} view(s) scroll horizontally:`);
		for (const s of overflowing) console.error(`    ${s.file}  +${s.overflow}px`);
		process.exit(1);
	}
}

async function writeIndex(shots) {
	const byTemplate = new Map();
	for (const shot of shots) {
		if (!byTemplate.has(shot.name)) byTemplate.set(shot.name, []);
		byTemplate.get(shot.name).push(shot);
	}

	const sections = [...byTemplate.entries()]
		.map(
			([name, items]) => `
	<h2>${name}</h2>
	<div class="grid">
		${items
			.map(
				(s) => `<figure${s.overflow > 1 ? ' class="bad"' : ''}>
			<a href="${s.file}"><img src="${s.file}" alt="${s.scenario.label}" loading="lazy"></a>
			<figcaption>
				<strong>${s.scenario.label}</strong>
				<span>${s.scenario.question}</span>
				${s.overflow > 1 ? `<em>Horizontal overflow: +${s.overflow}px</em>` : ''}
			</figcaption>
		</figure>`
			)
			.join('\n\t\t')}
	</div>`
		)
		.join('\n');

	const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GHI email QA contact sheet</title>
<style>
	:root { color-scheme: light dark; }
	body { margin: 0; padding: 40px; font-family: Liberation Sans, Arial, sans-serif; background: #fff; color: #2b2b2b; }
	h1 { font-family: Gelasio, Georgia, serif; font-weight: 600; font-size: 34px; margin: 0 0 8px; color: #1f3d34; }
	.note { max-width: 70ch; font-size: 14px; line-height: 1.6; color: #6b6b6b; margin: 0 0 40px; }
	h2 { font-family: Gelasio, Georgia, serif; font-weight: 400; font-size: 24px; color: #1f3d34; margin: 48px 0 16px; }
	.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
	figure { margin: 0; border: 1px solid #e2ded5; }
	figure.bad { border-color: #b3261e; }
	img { display: block; width: 100%; height: auto; }
	figcaption { padding: 12px 16px; border-top: 1px solid #e2ded5; font-size: 13px; line-height: 1.5; }
	figcaption strong { display: block; color: #1f3d34; }
	figcaption span { color: #6b6b6b; }
	figcaption em { display: block; margin-top: 6px; color: #b3261e; font-style: normal; font-weight: 500; }
	@media (prefers-color-scheme: dark) {
		body { background: #1c231e; color: #e8e5df; }
		h1, h2, figcaption strong { color: #c5d6c0; }
		figure { border-color: #2a332c; }
		figcaption { border-color: #2a332c; }
	}
</style>
</head>
<body>
<h1>Email QA contact sheet</h1>
<p class="note">
	Chromium renders these, which makes them a fair proxy for Apple Mail and Gmail web and
	no proxy at all for classic Outlook for Windows, Gmail's CSS filtering, or forced
	dark-mode inversion. A clean sheet here means the build is worth testing properly
	against the client matrix in docs/04-qa-plan.md.
</p>
${sections}
</body>
</html>
`;

	await writeFile(join(outDir, 'index.html'), html);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
