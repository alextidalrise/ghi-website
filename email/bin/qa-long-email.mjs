#!/usr/bin/env node
/**
 * Segment renderer for long-form campaigns that exceed Chromium's dependable
 * full-page capture limit. It scrolls through the document in viewport-sized
 * slices so every module, not only the opening screen, is reviewable.
 *
 *   node bin/qa-long-email.mjs portugal-v15
 *   node bin/qa-long-email.mjs https://example.com/archive stored-preview
 */
import { readFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { safeOutputName } from '../lib/safe-output-name.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const target = process.argv[2];
if (!target) throw new Error('Pass a built template name or a preview URL.');
const isUrl = /^https?:\/\//i.test(target);
const name = safeOutputName(isUrl ? (process.argv[3] || 'remote-preview') : target);

const segmentsRoot = resolve(root, 'qa', 'segments');
const outDir = resolve(segmentsRoot, name);
const relativeOutput = relative(segmentsRoot, outDir);
if (relativeOutput.startsWith('..') || relativeOutput === '') {
  throw new Error('QA output directory must remain below qa/segments.');
}

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const html = isUrl ? null : await readFile(join(root, 'build_production', `${name}.html`), 'utf8');
await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });
const browser = await chromium.launch(executablePath ? { executablePath } : {});

const views = [
  { id: 'desktop', width: 700, height: 1800 },
  { id: 'mobile', width: 375, height: 1800 },
  { id: 'narrow', width: 320, height: 1800 }
];
const records = [];
for (const view of views) {
  const context = await browser.newContext({ viewport: { width: view.width, height: view.height }, deviceScaleFactor: 1, colorScheme: 'light' });
  const page = await context.newPage();
  if (isUrl) await page.goto(target, { waitUntil: 'networkidle' });
  else await page.setContent(html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ''), { waitUntil: 'networkidle' });
  const metrics = await page.evaluate(() => ({ height: document.documentElement.scrollHeight, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }));
  const count = Math.ceil(metrics.height / view.height);
  for (let index = 0; index < count; index += 1) {
    const y = Math.min(index * view.height, Math.max(0, metrics.height - view.height));
    await page.evaluate((top) => window.scrollTo(0, top), y);
    const file = `${view.id}-${String(index + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: join(outDir, file) });
    records.push({ ...view, file, index: index + 1, count, y, documentHeight: metrics.height, overflow: metrics.overflow });
    console.log(`${file} y=${y}/${metrics.height} overflow=${metrics.overflow}`);
  }
  await context.close();
}
await browser.close();
await writeFile(join(outDir, 'manifest.json'), `${JSON.stringify(records, null, 2)}\n`);
