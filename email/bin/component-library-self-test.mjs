#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const requiredComponents = [
	'editorial-lead.html',
	'section-intro.html',
	'destination-feature.html',
	'advisory-cta.html',
	'entity-card.html',
	'card-pair.html',
	'small-print.html',
	'partner-cell.html',
	'partner-grid-row.html',
	'guide-card.html',
	'dual-action-enquiry.html'
];

const expectedPortugalHeadings = [
	'Golf Homes International in Portugal: Golf Property Across the Algarve',
	'The specialist estate agency for golf destinations',
	'Four Algarve golf-property destinations',
	'Our current Portugal property collection',
	'Golf across our Portugal locations',
	'Independent support around the purchase',
	'Portugal buying guides',
	'Enquire about golf property in Portugal'
];

const expectedPortugalMarkers = [
	'data-component="destination-feature"',
	'data-component="entity-card"',
	'data-component="partner-cell"',
	'data-component="guide-card"',
	'data-component="dual-action-enquiry"'
];

const forbiddenPortugalCopy = ['A more useful way to compare the Algarve'];

let failures = 0;

async function exists(path, label) {
	try {
		await access(path);
		console.log(`  ok    ${label}`);
	} catch {
		console.error(`  FAIL  ${label}: missing ${path}`);
		failures += 1;
	}
}

for (const name of requiredComponents) {
	await exists(join(root, 'src', 'components', name), `component ${name}`);
}

await exists(join(root, 'src', 'templates', 'component-library-v1.html'), 'all-components source template');
await exists(join(root, 'src', 'templates', 'portugal-v15.html'), 'Portugal v15 source template');

const builtHtmlPath = join(root, 'build_production', 'portugal-v15.html');
const builtTextPath = join(root, 'build_production', 'portugal-v15.txt');

try {
	const [html, text] = await Promise.all([
		readFile(builtHtmlPath, 'utf8'),
		readFile(builtTextPath, 'utf8')
	]);
	const normalizedHtml = html.replace(/\s+/g, ' ');

	for (const heading of expectedPortugalHeadings) {
		const htmlHas = normalizedHtml.includes(heading);
		const textHas = text.toUpperCase().includes(heading.toUpperCase());
		if (htmlHas && textHas) console.log(`  ok    heading parity: ${heading}`);
		else {
			console.error(`  FAIL  heading parity: ${heading} (html=${htmlHas}, text=${textHas})`);
			failures += 1;
		}
	}

	for (const marker of expectedPortugalMarkers) {
		if (html.includes(marker)) console.log(`  ok    compiled marker ${marker}`);
		else {
			console.error(`  FAIL  compiled marker missing: ${marker}`);
			failures += 1;
		}
	}

	const expectedCounts = new Map([
		['data-component="destination-feature"', 4],
		['data-component="entity-card"', 14],
		['data-component="partner-cell"', 8],
		['data-component="guide-card"', 2]
	]);
	for (const [marker, expected] of expectedCounts) {
		const actual = html.split(marker).length - 1;
		if (actual === expected) console.log(`  ok    ${marker} count ${actual}`);
		else {
			console.error(`  FAIL  ${marker} count ${actual}; expected ${expected}`);
			failures += 1;
		}
	}

	for (const required of ['Enquire about Portugal property', 'WhatsApp our Portugal team', 'Monte Rei Golf &amp; Country Club']) {
		if (normalizedHtml.includes(required)) console.log(`  ok    required compiled copy: ${required}`);
		else {
			console.error(`  FAIL  required compiled copy missing: ${required}`);
			failures += 1;
		}
	}

	if (html.includes('&amp;amp;')) {
		console.error('  FAIL  double-escaped visible entity found: &amp;amp;');
		failures += 1;
	} else console.log('  ok    no double-escaped visible entities');

	const repeatedStatusCount = text.split('Under construction').length - 1;
	if (repeatedStatusCount >= 5) console.log(`  ok    repeated commercial statuses preserved (${repeatedStatusCount})`);
	else {
		console.error(`  FAIL  repeated commercial statuses lost in plain text (${repeatedStatusCount})`);
		failures += 1;
	}

	for (const forbidden of forbiddenPortugalCopy) {
		if (!html.includes(forbidden) && !text.includes(forbidden)) {
			console.log(`  ok    forbidden copy absent: ${forbidden}`);
		} else {
			console.error(`  FAIL  forbidden copy present: ${forbidden}`);
			failures += 1;
		}
	}
} catch (error) {
	console.error(`  FAIL  compiled Portugal artefacts unavailable: ${error.message}`);
	failures += 1;
}

console.log(`\n  Component-library contract: ${failures ? 'FAIL' : 'PASS'}`);
if (failures) process.exit(1);
