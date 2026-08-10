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
const approvedPreview = 'Explore Vilamoura, Quinta do Lago, Monte Rei and Palmares, with current developments, golf and independent buyer support.';
const expectedSocialLinks = [
	['Instagram', 'https://www.instagram.com/golfhomesinternational/?utm_source=mailchimp&utm_medium=email', '2c920cce-3ac9-d4c1-b8fe-20d02fb2e113.png'],
	['LinkedIn', 'https://www.linkedin.com/company/golf-homes-international?utm_source=mailchimp&utm_medium=email', 'fb1db59d-5a98-4778-cad5-7a6300e42056.png'],
];

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
	const source = await readFile(join(root, 'src', 'templates', 'portugal-v15.html'), 'utf8');
	const normalizedHtml = html.replace(/\s+/g, ' ');
	const normalizedText = text.replace(/\s+/g, ' ');

	const identityPairs = [
		['Palmares destination', /<x-destination-feature\b[^>]*title="Palmares"[^>]*src="[^"]*\/1b476154ab3e9246b2573b889c362cc40dfdb8ba-1600x1066\.jpg/],
		['Palmares development', /<x-entity-card\b[^>]*title="Palmares"[^>]*src="[^"]*\/637d376128a5a9b9282a334c1ed370485542f82c-5272x3948\.jpg/]
	];
	for (const [label, pattern] of identityPairs) {
		if (pattern.test(source)) console.log(`  ok    approved image identity: ${label}`);
		else {
			console.error(`  FAIL  approved image identity: ${label}`);
			failures += 1;
		}
	}

	if (normalizedHtml.includes(approvedPreview)) console.log('  ok    hidden preheader matches Mailchimp preview setting');
	else {
		console.error('  FAIL  hidden preheader differs from Mailchimp preview setting');
		failures += 1;
	}

	const heroHeading = 'Golf Homes International in Portugal: Golf Property Across the Algarve';
	const heroAlt = 'Aerial view across Quinta do Lago towards the Ria Formosa and Atlantic coast';
	const approvedHierarchy = html.indexOf(heroHeading) >= 0 && html.indexOf(heroHeading) < html.indexOf(heroAlt);
	const plainHierarchy = normalizedText.indexOf(heroHeading.toUpperCase()) >= 0 && normalizedText.indexOf(heroHeading.toUpperCase()) < normalizedText.indexOf(heroAlt);
	if (approvedHierarchy && plainHierarchy) console.log('  ok    hero hierarchy is copy-first in HTML and plain text');
	else {
		console.error(`  FAIL  hero hierarchy copy-first (html=${approvedHierarchy}, text=${plainHierarchy})`);
		failures += 1;
	}

	const editionHtml = html.split('data-masthead-edition').length - 1;
	const editionText = (text.match(/^Portugal collection$/gm) || []).length;
	const overlineRemoved = !source.includes('<x-overline gap="12">Portugal</x-overline>');
	if (editionHtml === 1 && editionText === 1 && overlineRemoved) console.log('  ok    canonical masthead edition restored without duplicate hero overline');
	else {
		console.error(`  FAIL  masthead edition/overline contract (html=${editionHtml}, text=${editionText}, overlineRemoved=${overlineRemoved})`);
		failures += 1;
	}

	const courseCtaHtml = html.split('View course →').length - 1;
	const courseCtaText = text.split('View course →').length - 1;
	if (courseCtaHtml === 4 && courseCtaText === 4) console.log('  ok    four canonical course action labels retained in HTML and plain text');
	else {
		console.error(`  FAIL  course action labels (html=${courseCtaHtml}, text=${courseCtaText})`);
		failures += 1;
	}

	for (const [label, href, icon] of expectedSocialLinks) {
		const encodedHref = href.replace(/&/g, '&amp;');
		const htmlHas = html.includes(`href="${encodedHref}"`) && html.includes(icon);
		const textHas = text.includes(`${label}: ${href}`);
		if (htmlHas && textHas) console.log(`  ok    reusable footer social parity: ${label}`);
		else {
			console.error(`  FAIL  reusable footer social parity: ${label} (html=${htmlHas}, text=${textHas})`);
			failures += 1;
		}
	}

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

	for (const malformed of [')Currency', ')Legal', 'buyersA step-by-step', 'buyersAn overview']) {
		if (!text.includes(malformed)) console.log(`  ok    malformed plain-text join absent: ${malformed}`);
		else {
			console.error(`  FAIL  malformed plain-text join: ${malformed}`);
			failures += 1;
		}
	}

	const plainParagraphs = text.split(/\n{2,}/).map((part) => part.replace(/\n/g, ' ').trim()).filter(Boolean);
	for (const [label, body] of [
		['For UK buyers', 'A step-by-step introduction to the NIF, legal process, purchase costs, mortgages, tax and the 90-day rule.'],
		['For international buyers', 'An overview of preparation, the legal process, purchase costs, finance, tax and residency boundaries.'],
	]) {
		const labelIndex = plainParagraphs.indexOf(label);
		if (labelIndex >= 0 && plainParagraphs[labelIndex + 1] === body) console.log(`  ok    plain-text block separation: ${label}`);
		else {
			console.error(`  FAIL  plain-text block separation missing: ${label}`);
			failures += 1;
		}
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
