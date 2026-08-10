#!/usr/bin/env node

import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const sourceDir = join(root, 'src', 'assets', 'social');
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

const browser = await chromium.launch({
	headless: true,
	...(executablePath ? { executablePath } : {}),
});

try {
	for (const name of ['instagram', 'linkedin']) {
		const source = await readFile(join(sourceDir, `${name}.svg`), 'utf8');
		for (const variant of [
			{ suffix: '', svg: source },
			{ suffix: '-green', svg: source.replaceAll('#D6C3A3', '#1F3D34') },
		]) {
			const page = await browser.newPage({ viewport: { width: 72, height: 72 }, deviceScaleFactor: 1 });
			await page.setContent(`<html><body style="margin:0;background:transparent">${variant.svg}</body></html>`);
			await page.screenshot({
				path: join(sourceDir, `${name}${variant.suffix}@2x.png`),
				type: 'png',
				omitBackground: true,
				clip: { x: 0, y: 0, width: 72, height: 72 },
			});
			await page.close();
			console.log(`generated ${name}${variant.suffix}@2x.png`);
		}
	}
} finally {
	await browser.close();
}
