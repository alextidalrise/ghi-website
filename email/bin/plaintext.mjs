#!/usr/bin/env node
/**
 * Generate the plain-text alternative for every built template.
 *
 *   node bin/plaintext.mjs              # write build_production/*.txt
 *   node bin/plaintext.mjs --check      # fail if any .txt is stale
 *   node bin/plaintext.mjs --print reference
 *
 * `--check` is what runs in CI: it regenerates in memory and compares, so a
 * committed .txt can never drift from the HTML beside it.
 */

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { generatePlaintext } from '../lib/plaintext.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const args = process.argv.slice(2);
const flagValue = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const sourceDir = resolve(root, flagValue('dir', 'build_production'));
const checkOnly = args.includes('--check');
const printOnly = flagValue('print', null);

/** The locale is declared in the template's front matter and survives into <html lang>. */
function localeOf(html) {
	const m = /<html\b[^>]*\blang\s*=\s*"([^"]*)"/i.exec(html);
	return m ? m[1] : 'en';
}

async function main() {
	const files = (await readdir(sourceDir)).filter((f) => f.endsWith('.html'));

	if (!files.length) {
		console.error(`No built templates in ${sourceDir}. Run \`pnpm build\` first.`);
		process.exit(1);
	}

	let stale = 0;

	for (const file of files) {
		const name = basename(file, '.html');
		if (printOnly && name !== printOnly) continue;

		const html = await readFile(join(sourceDir, file), 'utf8');
		const text = generatePlaintext(html, { locale: localeOf(html) });

		if (printOnly) {
			process.stdout.write(text);
			continue;
		}

		const outPath = join(sourceDir, `${name}.txt`);

		if (checkOnly) {
			const existing = await readFile(outPath, 'utf8').catch(() => null);
			if (existing !== text) {
				console.error(`  STALE  ${name}.txt does not match the current HTML`);
				stale += 1;
			} else {
				console.log(`  ok     ${name}.txt`);
			}
			continue;
		}

		await writeFile(outPath, text);
		console.log(`  ${name}.txt  ${text.split('\n').length} lines, ${text.length} chars`);
	}

	if (stale) {
		console.error(`\n  ${stale} plain-text file(s) out of date. Run \`pnpm plaintext\`.`);
		process.exit(1);
	}

	if (!printOnly && !checkOnly) {
		console.log(
			'\n  Review these before sending. Mailchimp will otherwise substitute its own\n' +
				'  auto-generated version, which drops link context and footer structure.'
		);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
