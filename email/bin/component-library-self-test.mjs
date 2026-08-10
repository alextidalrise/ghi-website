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
	'development-card.html',
	'course-feature.html',
	'advisory-cta.html',
	'entity-card.html',
	'card-pair.html',
	'small-print.html',
	'partner-cell.html',
	'partner-grid-row.html',
	'guide-card.html',
	'dual-action-enquiry.html',
	'footer-light.html'
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
	'data-component="development-card"',
	'data-component="course-feature"',
	'data-component="partner-cell"',
	'data-component="guide-card"',
	'data-component="dual-action-enquiry"'
];

const forbiddenPortugalCopy = ['A more useful way to compare the Algarve', 'Olive Grove Partners', 'Nueva Vida Group'];
const approvedPreview = 'Explore Vilamoura, Quinta do Lago, Monte Rei and Palmares, with current developments, golf and independent buyer support.';
const expectedSocialLinks = [
	['Instagram', 'https://www.instagram.com/golfhomesinternational/?utm_source=mailchimp&utm_medium=email', 'e94b0a42-1a48-ccb5-779b-a91f9b3168de.png', '2c920cce-3ac9-d4c1-b8fe-20d02fb2e113.png'],
	['LinkedIn', 'https://www.linkedin.com/company/golf-homes-international?utm_source=mailchimp&utm_medium=email', '1a1bf10b-e0ae-24e9-0413-439834506287.png', 'fb1db59d-5a98-4778-cad5-7a6300e42056.png'],
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
	const [html, text, componentHtml, entitySource, destinationSource, developmentSource, guideSource, cssSource] = await Promise.all([
		readFile(builtHtmlPath, 'utf8'),
		readFile(builtTextPath, 'utf8'),
		readFile(join(root, 'build_production', 'component-library-v1.html'), 'utf8'),
		readFile(join(root, 'src', 'components', 'entity-card.html'), 'utf8'),
		readFile(join(root, 'src', 'components', 'destination-feature.html'), 'utf8'),
		readFile(join(root, 'src', 'components', 'development-card.html'), 'utf8'),
		readFile(join(root, 'src', 'components', 'guide-card.html'), 'utf8'),
		readFile(join(root, 'src', 'css', 'main.css'), 'utf8')
	]);
	const source = await readFile(join(root, 'src', 'templates', 'portugal-v15.html'), 'utf8');
	const normalizedHtml = html.replace(/\s+/g, ' ');
	const normalizedText = text.replace(/\s+/g, ' ');

	const identityPairs = [
		['Palmares destination', /<x-destination-feature\b[^>]*title="Palmares"[^>]*src="[^"]*\/1b476154ab3e9246b2573b889c362cc40dfdb8ba-1600x1066\.jpg/],
		['Palmares development', /<x-development-card\b[^>]*title="Palmares"[^>]*src="[^"]*\/637d376128a5a9b9282a334c1ed370485542f82c-5272x3948\.jpg/]
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
	const courseCtaText = text.split('VIEW COURSE →').length - 1;
	if (courseCtaHtml === 4 && courseCtaText === 4) console.log('  ok    four canonical course action labels retained in HTML and plain text');
	else {
		console.error(`  FAIL  course action labels (html=${courseCtaHtml}, text=${courseCtaText})`);
		failures += 1;
	}

	for (const [label, href, lightIcon, greenIcon] of expectedSocialLinks) {
		const encodedHref = href.replace(/&/g, '&amp;');
		const htmlHas = html.includes(`href="${encodedHref}"`) && html.includes(lightIcon);
		const greenAvailable = componentHtml.includes(`href="${encodedHref}"`) && componentHtml.includes(greenIcon);
		const textHas = text.includes(`${label}: ${href}`);
		if (htmlHas && greenAvailable && textHas) console.log(`  ok    light/green footer social parity: ${label}`);
		else {
			console.error(`  FAIL  light/green footer social parity: ${label} (light=${htmlHas}, green=${greenAvailable}, text=${textHas})`);
			failures += 1;
		}
	}

	const lightFooterSelected = html.split('data-footer-variant="light"').length - 1 === 1 && !html.includes('data-footer-variant="green"');
	const greenFooterAvailable = componentHtml.split('data-footer-variant="green"').length - 1 === 1;
	const lightFooterAvailable = componentHtml.split('data-footer-variant="light"').length - 1 === 1;
	const closingStart = html.indexOf('data-component="dual-action-enquiry"');
	const lightFooterStart = html.indexOf('data-footer-variant="light"');
	const closingBoundary = html.slice(closingStart, lightFooterStart);
	const gapRemoved = closingStart >= 0 && lightFooterStart > closingStart && !closingBoundary.includes('height:24px');
	const closingPlain = text.includes('ENQUIRE ABOUT GOLF PROPERTY IN PORTUGAL') && text.includes('WHATSAPP OUR PORTUGAL TEAM');
	if (lightFooterSelected && greenFooterAvailable && lightFooterAvailable && gapRemoved && closingPlain) console.log('  ok    light footer selected, both footer blocks available, CTA/footer gap removed');
	else {
		console.error(`  FAIL  footer variant/gap contract (campaignLight=${lightFooterSelected}, libraryGreen=${greenFooterAvailable}, libraryLight=${lightFooterAvailable}, gapRemoved=${gapRemoved}, plainCTA=${closingPlain})`);
		failures += 1;
	}

	const equalHeightContract = entitySource.includes('height="{{ cardheight }}"')
		&& entitySource.includes('height="{{ bodyheight }}"')
		&& entitySource.includes('sm-equal-card-row')
		&& guideSource.includes("layout === 'full' ? 500 : 460")
		&& guideSource.includes('text-underline-offset:5px')
		&& !source.includes('tone="green"')
		&& entitySource.includes('text-transform:uppercase')
		&& entitySource.includes('background-color:{{ page.brand.white }}')
		&& entitySource.includes('color:{{ page.brand.green }};text-decoration:none')
		&& destinationSource.includes('background-color:{{ page.brand.green }};padding:10px 12px')
		&& destinationSource.includes('text-decoration:underline;text-underline-offset:5px')
		&& destinationSource.includes('text-transform:uppercase')
		&& developmentSource.includes('data-component="development-card"')
		&& developmentSource.includes('font-size:28px')
		&& developmentSource.includes('text-underline-offset:5px')
		&& developmentSource.includes('background-color:{{ page.brand.green }}')
		&& cssSource.includes('.sm-equal-card')
		&& cssSource.includes('.sm-equal-card-row')
		&& cssSource.includes('height: auto !important;');
	if (equalHeightContract) console.log('  ok    entity and guide card pairs equalise above mobile and reset when stacked');
	else {
		console.error('  FAIL  equal-height paired-card contract');
		failures += 1;
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
		['data-component="development-card"', 10],
		['data-component="course-feature"', 4],
		['data-component="partner-cell"', 6],
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

	for (const required of ['Enquire about Portugal property', 'WhatsApp our Portugal team', 'Request an introduction', 'View development →', 'Monte Rei Golf &amp; Country Club']) {
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
