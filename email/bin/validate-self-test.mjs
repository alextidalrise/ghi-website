#!/usr/bin/env node
/**
 * Prove the validator catches what it claims to catch.
 *
 *   node bin/validate-self-test.mjs
 *
 * A validator that only ever passes is worse than no validator: it produces
 * confidence without evidence. Each case below is a deliberately broken email
 * that must trip exactly the named check. If someone loosens a rule while
 * refactoring, this fails.
 *
 * Runs in CI alongside the real validation. See docs/05-release-process.md.
 */

import { validate } from '../lib/validate.mjs';

/** A minimal but valid email, used as the base each case breaks in one way. */
const GOOD = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head><title>A short subject line</title></head>
<body>
<div style="display:none;font-size:1px;mso-hide:all;color:#ffffff;">A preheader line that says something specific.</div>
<table role="presentation"><tr>
<td class="sm-gutter" bgcolor="#1f3d34" style="background-color:#1f3d34;padding:32px;">
  <img src="https://www.golfhomesinternational.com/email/logo-ivory@2x.png" width="200" height="45" alt="Golf Homes International">
</td></tr>
<tr><td class="sm-gutter" style="background-color:#ffffff;padding:40px 32px;">
  <h1 style="color:#1f3d34;font-size:34px;">Six houses on the fairway</h1>
  <p style="color:#2b2b2b;font-size:16px;">Body copy that is long enough to be measured properly by the checks.</p>
  <table role="presentation"><tr><td bgcolor="#1f3d34" style="background-color:#1f3d34;padding:16px 32px;"><a href="https://www.golfhomesinternational.com/spain?utm_source=mailchimp" style="display:block;color:#f5f1e8;font-size:14px;">View the collection</a></td></tr></table>
</td></tr>
<tr><td class="sm-gutter" bgcolor="#1f3d34" style="background-color:#1f3d34;padding:40px 32px;">
  <p style="color:#f5f1e8;font-size:13px;">You are receiving this because you asked us to keep you informed about property near the golf courses of southern Europe.</p>
  <p style="color:#f5f1e8;font-size:13px;">*|LIST:COMPANY|*, *|LIST:ADDRESS|*</p>
  <a href="*|ARCHIVE_PAGE_URL|*" style="color:#d6c3a3;text-decoration:underline;">View in browser</a>
  <a href="*|UPDATE_PROFILE|*" style="color:#d6c3a3;text-decoration:underline;">Preferences</a>
  <a href="*|UNSUB|*" style="color:#d6c3a3;text-decoration:underline;">Unsubscribe</a>
</td></tr></table>
</body></html>`;

/** @type {{name: string, check: string, html: string}[]} */
const cases = [
	{
		name: 'missing h1',
		check: 'required-content',
		html: GOOD.replace(/<h1[^>]*>/, '<p>').replace('</h1>', '</p>')
	},
	{
		name: 'empty preheader',
		check: 'copy-length',
		html: GOOD.replace('A preheader line that says something specific.', '')
	},
	{
		name: 'non-HTTPS link',
		check: 'links',
		html: GOOD.replace('https://www.golfhomesinternational.com/spain?utm_source=mailchimp', 'http://example.com')
	},
	{
		name: 'relative link',
		check: 'links',
		html: GOOD.replace('https://www.golfhomesinternational.com/spain?utm_source=mailchimp', '/spain')
	},
	{
		name: 'double-escaped ampersand',
		check: 'links',
		html: GOOD.replace('?utm_source=mailchimp', '?utm_source=mailchimp&amp;amp;utm_medium=email')
	},
	{
		name: 'image with no alt attribute',
		check: 'alt-text',
		html: GOOD.replace(' alt="Golf Homes International"', '')
	},
	{
		name: 'SVG image',
		check: 'assets',
		html: GOOD.replace('logo-ivory@2x.png', 'logo-ivory.svg')
	},
	{
		name: 'Sanity URL with auto=format',
		check: 'assets',
		html: GOOD.replace(
			'https://www.golfhomesinternational.com/email/logo-ivory@2x.png',
			'https://cdn.sanity.io/images/s88o8sjb/development/abc-1200x800.jpg?auto=format&w=1200'
		)
	},
	{
		name: 'unknown merge tag',
		check: 'merge-tags',
		html: GOOD.replace('*|UNSUB|*', '*|UNSUBSCRIBE|*')
	},
	{
		name: 'unbalanced IF block',
		check: 'merge-tags',
		html: GOOD.replace('<h1', '*|IF:FNAME|*<h1')
	},
	{
		name: 'unguarded FNAME',
		check: 'merge-tags',
		html: GOOD.replace('Six houses', 'Dear *|FNAME|*, six houses')
	},
	{
		name: 'missing unsubscribe',
		check: 'footer',
		html: GOOD.replace('*|UNSUB|*', 'https://example.com/unsub')
	},
	{
		name: 'oversized HTML',
		check: 'size',
		html: GOOD.replace('</body>', `<div>${'x'.repeat(110 * 1024)}</div></body>`)
	},
	{
		name: 'failing contrast',
		check: 'contrast',
		html: GOOD.replace('color:#2b2b2b;font-size:16px;', 'color:#b8b8b8;font-size:16px;')
	},
	{
		name: 'gold text on white',
		check: 'contrast',
		html: GOOD.replace(
			'<p style="color:#2b2b2b;font-size:16px;">',
			'<p style="color:#d6c3a3;background-color:#ffffff;font-size:16px;">'
		)
	},
	{
		name: 'skipped heading level',
		check: 'heading-order',
		html: GOOD.replace('<p style="color:#2b2b2b;font-size:16px;">', '<h3 style="color:#2b2b2b;font-size:16px;">').replace(
			'properly.</p>',
			'properly.</h3>'
		)
	},
	{
		name: 'two h1 elements',
		check: 'heading-order',
		html: GOOD.replace('</table>', '<tr><td><h1>Second</h1></td></tr></table>')
	},
	{ name: 'script tag', check: 'unsupported', html: GOOD.replace('</body>', '<script>alert(1)</script></body>') },
	{ name: 'flexbox', check: 'unsupported', html: GOOD.replace('padding:32px;', 'padding:32px;display:flex;') },
	{
		name: 'border-radius (brand rule)',
		check: 'unsupported',
		html: GOOD.replace('padding:32px;', 'padding:32px;border-radius:4px;')
	},
	{
		name: 'table without role=presentation',
		check: 'unsupported',
		html: GOOD.replace('<table role="presentation">', '<table>')
	},
	{ name: 'missing lang', check: 'language', html: GOOD.replace(' lang="en"', '') },
	{
		name: 'two green bands in the body',
		check: 'brand',
		html: GOOD.replace(
			'</table>',
			'<tr><td class="sm-gutter" style="background-color:#1f3d34;padding:40px 32px;"><p style="color:#f5f1e8;font-size:16px;">Extra band</p></td></tr>' +
				'<tr><td class="sm-gutter" style="background-color:#1f3d34;padding:40px 32px;"><p style="color:#f5f1e8;font-size:16px;">Another</p></td></tr></table>'
		)
	},
	{
		name: 'asymmetric horizontal padding (breaks RTL)',
		check: 'rtl',
		html: GOOD.replace('padding:40px 32px;', 'padding:40px 32px 40px 8px;')
	},
	{
		name: 'link not underlined at rest',
		check: 'brand',
		/* A warning, not an error: the exclusion heuristic for buttons and
		   image wrappers is approximate, and a false error would block builds. */
		level: 'warn',
		html: GOOD.replace(
			'<a href="*|UNSUB|*" style="color:#d6c3a3;text-decoration:underline;">',
			'<a href="*|UNSUB|*" style="color:#d6c3a3;">'
		)
	}
];

/* The clean baseline must produce no errors, or every case below is meaningless. */
const baseline = validate({ html: GOOD, name: 'baseline' }).filter((f) => f.level === 'error');

let failures = 0;

if (baseline.length) {
	console.error('  BASELINE IS NOT CLEAN. The good fixture must pass before broken ones mean anything:');
	for (const f of baseline) console.error(`    ${f.check}: ${f.message}`);
	failures += 1;
} else {
	console.log('  ok    baseline fixture passes with no errors');
}

for (const testCase of cases) {
	const findings = validate({ html: testCase.html, name: testCase.name });
	const wanted = testCase.level || 'error';
	const caught = findings.some((f) => f.check === testCase.check && f.level === wanted);

	if (caught) {
		console.log(`  ok    ${testCase.name}  ->  ${testCase.check}`);
	} else {
		console.error(`  FAIL  ${testCase.name}  ->  expected a ${wanted} from "${testCase.check}"`);
		const got = findings.filter((f) => f.level === wanted).map((f) => f.check);
		console.error(`        got: ${got.length ? got.join(', ') : 'no errors at all'}`);
		failures += 1;
	}
}

console.log(`\n  ${cases.length - failures + 1}/${cases.length + 1} checks verified.`);

if (failures) {
	console.error(`  ${failures} validator check(s) are not working.`);
	process.exit(1);
}
