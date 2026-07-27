#!/usr/bin/env node
/**
 * Validate every built template.
 *
 *   node bin/validate.mjs                    # build_production, offline
 *   node bin/validate.mjs --links            # also resolve every link over HTTP
 *   node bin/validate.mjs --delivered f.html # check Mailchimp's delivered source
 *   node bin/validate.mjs --json             # machine-readable, for the agent
 *
 * Exit code is 0 only when there are no errors. Warnings do not fail the build;
 * they are judgement calls a person should look at.
 *
 * The --delivered mode is the important one before a send. Mailchimp rewrites
 * every href into a tracking URL and injects its own footer markup AFTER we hand
 * the file over, so the compiled file is not what lands in the inbox. Size and
 * link checks are only conclusive against the delivered source.
 * See docs/04-qa-plan.md.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, dirname, basename, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validate, checkLinksLive } from '../lib/validate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const args = process.argv.slice(2);
const flagValue = (name, fallback) => {
	const i = args.indexOf(`--${name}`);
	return i !== -1 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};

const sourceDir = resolve(root, flagValue('dir', 'build_production'));
const deliveredFile = flagValue('delivered', null);
const withLinks = args.includes('--links');
const asJson = args.includes('--json');

const COLOR = {
	error: '[31m',
	warn: '[33m',
	info: '[90m',
	reset: '[0m',
	bold: '[1m'
};

async function main() {
	const targets = [];

	if (deliveredFile) {
		const path = resolve(process.cwd(), deliveredFile);
		targets.push({
			name: basename(path),
			html: await readFile(path, 'utf8'),
			text: null,
			delivered: true
		});
	} else {
		const files = (await readdir(sourceDir)).filter((f) => f.endsWith('.html'));

		if (!files.length) {
			console.error(`No built templates in ${sourceDir}. Run \`pnpm build\` first.`);
			process.exit(1);
		}

		for (const file of files) {
			const name = basename(file, '.html');
			targets.push({
				name,
				html: await readFile(join(sourceDir, file), 'utf8'),
				// Optional: only compared when the .txt has been generated.
				text: await readFile(join(sourceDir, `${name}.txt`), 'utf8').catch(() => null),
				delivered: false
			});
		}
	}

	const report = [];

	for (const target of targets) {
		const findings = validate(target);

		if (withLinks) {
			findings.push(...(await checkLinksLive(target.html)));
		}

		report.push({ name: target.name, findings });
	}

	if (asJson) {
		console.log(JSON.stringify({ report }, null, 2));
	} else {
		print(report, { withLinks });
	}

	const errors = report.reduce(
		(total, r) => total + r.findings.filter((f) => f.level === 'error').length,
		0
	);

	process.exit(errors ? 1 : 0);
}

function print(report, { withLinks }) {
	let errors = 0;
	let warnings = 0;

	for (const { name, findings } of report) {
		console.log(`\n${COLOR.bold}${name}${COLOR.reset}`);

		const byCheck = new Map();
		for (const finding of findings) {
			if (!byCheck.has(finding.check)) byCheck.set(finding.check, []);
			byCheck.get(finding.check).push(finding);
		}

		for (const [check, items] of byCheck) {
			for (const item of items) {
				if (item.level === 'error') errors += 1;
				if (item.level === 'warn') warnings += 1;

				const tint = COLOR[item.level] ?? '';
				const label = item.level.toUpperCase().padEnd(5);
				console.log(`  ${tint}${label}${COLOR.reset} ${COLOR.info}${check}${COLOR.reset}  ${item.message}`);
			}
		}
	}

	console.log(
		`\n  ${errors} error(s), ${warnings} warning(s) across ${report.length} template(s).`
	);

	if (!withLinks) {
		console.log(`  ${COLOR.info}Links were not resolved. Run with --links before a send.${COLOR.reset}`);
	}

	if (errors === 0) {
		console.log(
			`  ${COLOR.info}Passing here means the build is worth testing against the client matrix,\n` +
				`  not that it renders correctly. See docs/04-qa-plan.md.${COLOR.reset}`
		);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
