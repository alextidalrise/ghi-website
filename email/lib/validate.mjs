/**
 * Build-time validation for GHI email.
 *
 * Two families of check:
 *
 *   1. The brief's list: missing required content, excessive copy length,
 *      broken links, missing alt text, non-HTTPS assets, invalid merge tags,
 *      missing footer requirements, HTML size, colour contrast, heading order,
 *      unsupported elements, plain-text completeness.
 *
 *   2. GHI brand rules, made executable. Zero border radius, gold never as ink
 *      on a light ground, the Emphasis Ladder's rationing of green bands and
 *      overlines, horizontal symmetry for RTL. A design system that only exists
 *      in a document drifts; one that fails the build does not.
 *
 * Runs against the COMPILED file and, with --delivered, against the source
 * pulled back from Mailchimp after upload. The second run is the one that
 * matters for size and links, because Mailchimp rewrites both.
 *
 * No DOM library: regex and a small tag scanner. That keeps this runnable by
 * the future agent as a plain Node script with no install step, and email HTML
 * is a narrow enough subset that parsing it properly buys little here.
 */

import { contrastRatio, formatRatio, requiredRatio } from './contrast.mjs';
import { budget, color, bannedTextOnLight } from './tokens.mjs';
import {
	extractMergeTags,
	isKnownMergeTag,
	unbalancedConditionals,
	tagsBlankInTestSend,
	REQUIRED_FOOTER_TAGS
} from './merge-tags.mjs';

/** @typedef {{level:'error'|'warn'|'info', check:string, message:string}} Finding */

const ERROR = 'error';
const WARN = 'warn';
const INFO = 'info';

/**
 * @param {object} input
 * @param {string} input.html      the built (or delivered) HTML
 * @param {string} [input.text]    the plain-text alternative
 * @param {string} [input.name]    template name, for messages
 * @param {boolean} [input.delivered]  true when checking Mailchimp's output
 * @returns {Finding[]}
 */
export function validate({ html, text = null, name = 'template', delivered = false }) {
	/** @type {Finding[]} */
	const findings = [];
	const add = (level, check, message) => findings.push({ level, check, message, name });

	checkRequiredContent(html, add);
	checkCopyLength(html, add);
	checkLinks(html, add, delivered);
	checkAltText(html, add);
	checkAssetProtocol(html, add);
	checkMergeTags(html, add);
	checkFooter(html, add);
	checkSize(html, add, delivered);
	checkContrast(html, add);
	checkHeadingOrder(html, add);
	checkUnsupportedElements(html, add);
	checkLanguage(html, add);
	checkBrandRules(html, add);
	checkRtlSymmetry(html, add);

	if (text !== null) checkPlaintext(html, text, add);

	return findings;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

/** Every `<tag ...>` of the given name, with its raw attribute string. */
function tags(html, tagName) {
	const re = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
	return [...html.matchAll(re)].map((m) => ({ raw: m[0], attrs: m[1], index: m.index }));
}

function attr(attrString, name) {
	const m = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrString);
	return m ? m[1] : null;
}

/** Strip tags, comments and merge tags to get readable text. */
function visibleText(html) {
	return html
		.replace(/<!--[\s\S]*?-->/g, ' ')
		.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
		.replace(/<[^>]+>/g, ' ')
		.replace(/\*\|[^|*]+\|\*/g, ' ')
		.replace(/&[a-z]+;|&#\d+;/gi, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function styleValue(styleString, property) {
	if (!styleString) return null;
	const m = new RegExp(`(?:^|;)\\s*${property}\\s*:\\s*([^;]+)`, 'i').exec(styleString);
	return m ? m[1].trim() : null;
}

/* -------------------------------------------------------------------------- */
/* 1. Missing required content                                                 */
/* -------------------------------------------------------------------------- */

function checkRequiredContent(html, add) {
	const title = /<title>([\s\S]*?)<\/title>/i.exec(html);
	if (!title || !title[1].trim()) {
		add(ERROR, 'required-content', 'No <title>. It names the view-in-browser page.');
	}

	// The preheader is the hidden first div; without it the inbox preview is
	// whatever body copy Gmail happens to grab.
	if (!/<div\b[^>]*display:\s*none[^>]*mso-hide:\s*all/i.test(html)) {
		add(ERROR, 'required-content', 'No preheader block found.');
	}

	if (!/<h1\b/i.test(html)) {
		add(ERROR, 'required-content', 'No <h1>. Every email needs one top-level heading.');
	}

	if (!/<a\b[^>]*href/i.test(html)) {
		add(ERROR, 'required-content', 'No links at all. An email with no action is not a campaign.');
	}
}

/* -------------------------------------------------------------------------- */
/* 2. Excessive copy length                                                    */
/* -------------------------------------------------------------------------- */

function checkCopyLength(html, add) {
	const title = /<title>([\s\S]*?)<\/title>/i.exec(html);
	if (title && title[1].trim().length > budget.maxSubjectChars) {
		add(
			WARN,
			'copy-length',
			`Subject/title is ${title[1].trim().length} chars; over ~${budget.maxSubjectChars} truncates in most inbox lists.`
		);
	}

	// Anchored to <div>. Unanchored, this matches the `mso-hide: all` rule
	// inside the <style> block first and captures half the document.
	const preheader = /<div\b[^>]*mso-hide:\s*all[^>]*>([\s\S]*?)<\/div>/i.exec(html);
	if (preheader) {
		/*
		 * Drop the zero-width padding run before measuring. It has to be
		 * stripped in BOTH forms: as entities, and as the literal characters
		 * they decode to, because the minifier decodes some of them. Measuring
		 * the padding as copy reports a 60-character preheader as 400 and buries
		 * the real check under a permanent false warning.
		 */
		const copy = preheader[1]
			.replace(/&[a-z]+;|&#\d+;/gi, '')
			.replace(/[\u034F\u00A0\u200B-\u200D\u2007\u2060\uFEFF]/g, '')
			.replace(/\s+/g, ' ')
			.trim();

		if (copy.length > budget.maxPreheaderChars) {
			add(
				WARN,
				'copy-length',
				`Preheader is ${copy.length} chars; over ~${budget.maxPreheaderChars} is cut off in every client.`
			);
		}
		if (copy.length === 0) {
			add(ERROR, 'copy-length', 'Preheader is empty.');
		}
	}

	for (const h1 of [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]) {
		const copy = visibleText(h1[1]);
		if (copy.length > budget.maxDisplayHeadingChars) {
			add(
				WARN,
				'copy-length',
				`Display heading is ${copy.length} chars ("${copy.slice(0, 50)}..."); over ~${budget.maxDisplayHeadingChars} wraps to four lines on a phone.`
			);
		}
	}

	/*
	 * CTA labels. A long label is the classic cause of a button that wraps to
	 * three lines at 320px, so it is measured rather than eyeballed.
	 */
	for (const a of [...html.matchAll(/<a\b[^>]*style="[^"]*display:\s*block[^"]*"[^>]*>([\s\S]*?)<\/a>/gi)]) {
		const label = visibleText(a[1]);
		if (label.length > budget.maxCtaLabelChars) {
			add(
				WARN,
				'copy-length',
				`CTA label "${label}" is ${label.length} chars; over ${budget.maxCtaLabelChars} wraps awkwardly at 320px.`
			);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 3. Links                                                                    */
/* -------------------------------------------------------------------------- */

function checkLinks(html, add, delivered) {
	const hrefs = [...html.matchAll(/<a\b[^>]*href\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);

	if (!hrefs.length) return;

	for (const href of hrefs) {
		const isMergeTag = /^\*\|/.test(href);
		if (isMergeTag) continue;

		if (href.trim() === '' || href === '#') {
			add(ERROR, 'links', `Empty or placeholder href ("${href}").`);
			continue;
		}

		/*
		 * Double-escaped ampersand. Writing `&amp;` in a template looks correct
		 * but PostHTML escapes it again, so `&amp;amp;` ships and the delivered
		 * URL contains a literal "&amp;" between query parameters. Every UTM
		 * value after the first is then part of the previous one's value, and
		 * the campaign silently reports as untagged traffic. Write a bare `&`
		 * in the template and let the build escape it once.
		 */
		if (/&amp;amp;/i.test(href)) {
			add(
				ERROR,
				'links',
				`Double-escaped ampersand in ${href.slice(0, 70)}. Write a plain & in the template; the build escapes it.`
			);
		}

		if (/^http:\/\//i.test(href)) {
			add(ERROR, 'links', `Non-HTTPS link: ${href}`);
			continue;
		}

		if (!/^https:\/\//i.test(href) && !/^mailto:/i.test(href) && !/^tel:/i.test(href)) {
			add(
				ERROR,
				'links',
				`Relative or unrecognised href: ${href}. Email has no base URL; every destination must be absolute.`
			);
			continue;
		}

		/*
		 * UTM parameters are a warning rather than an error: Mailchimp can add
		 * them at send time via the campaign's analytics option. Flagging them
		 * makes the choice deliberate instead of accidental.
		 *
		 * Skipped once delivered, since Mailchimp has by then rewritten every
		 * href into a click-tracking URL and the original query string is gone.
		 */
		if (!delivered && /^https:\/\//i.test(href) && !/utm_source=/i.test(href)) {
			add(WARN, 'links', `No utm_source on ${href.slice(0, 70)}`);
		}
	}

	const unique = new Set(hrefs.filter((h) => !/^\*\|/.test(h)));
	add(INFO, 'links', `${unique.size} unique destination(s) to validate independently.`);
}

/**
 * Resolve every campaign link over the network.
 *
 * Separate from validate() because it is slow and needs connectivity. Mailchimp's
 * Link Checker is unavailable for custom-coded campaigns, so this is the
 * replacement. See docs/04-qa-plan.md.
 *
 * @param {string} html
 * @returns {Promise<Finding[]>}
 */
export async function checkLinksLive(html, { timeoutMs = 10000 } = {}) {
	const findings = [];
	const hrefs = [
		...new Set(
			[...html.matchAll(/<a\b[^>]*href\s*=\s*"([^"]*)"/gi)]
				.map((m) => m[1])
				.filter((h) => /^https:\/\//i.test(h))
		)
	];

	for (const href of hrefs) {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), timeoutMs);

		try {
			/*
			 * GET, not HEAD. Plenty of CDNs and app servers answer HEAD with 405
			 * or 404 while the page itself is fine, which would produce false
			 * "broken link" reports on live campaign URLs.
			 */
			const response = await fetch(href, {
				method: 'GET',
				redirect: 'follow',
				signal: controller.signal,
				headers: { 'User-Agent': 'GHI-email-link-check/1.0' }
			});

			if (response.status >= 400) {
				findings.push({
					level: ERROR,
					check: 'links-live',
					message: `${response.status} ${response.statusText} — ${href}`
				});
			} else if (response.redirected) {
				findings.push({
					level: INFO,
					check: 'links-live',
					message: `redirects to ${response.url} — ${href}`
				});
			}
		} catch (error) {
			findings.push({
				level: ERROR,
				check: 'links-live',
				message: `${error.name === 'AbortError' ? 'timed out' : error.message} — ${href}`
			});
		} finally {
			clearTimeout(timer);
		}
	}

	return findings;
}

/* -------------------------------------------------------------------------- */
/* 4. Alt text                                                                 */
/* -------------------------------------------------------------------------- */

function checkAltText(html, add) {
	for (const img of tags(html, 'img')) {
		const alt = attr(img.attrs, 'alt');
		const src = attr(img.attrs, 'src') || '(no src)';

		if (alt === null) {
			add(
				ERROR,
				'alt-text',
				`<img> with no alt attribute: ${src.slice(-60)}. Use alt="" if it is decorative; omitting it is never correct.`
			);
		} else if (alt.trim() === '') {
			add(INFO, 'alt-text', `Decorative image (alt=""): ${src.slice(-60)}`);
		} else if (alt.trim().length < 8) {
			add(WARN, 'alt-text', `Alt text "${alt}" is very short; it is what a reader with images off gets instead.`);
		}

		if (!attr(img.attrs, 'width')) {
			add(WARN, 'alt-text', `<img> with no width attribute: ${src.slice(-60)}. Clients cannot reserve the box.`);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 5. Asset protocol and format                                                */
/* -------------------------------------------------------------------------- */

function checkAssetProtocol(html, add) {
	for (const img of tags(html, 'img')) {
		const src = attr(img.attrs, 'src');
		if (!src) {
			add(ERROR, 'assets', '<img> with no src.');
			continue;
		}

		if (/^http:\/\//i.test(src)) {
			add(ERROR, 'assets', `Non-HTTPS image: ${src}`);
		} else if (!/^https:\/\//i.test(src)) {
			add(
				ERROR,
				'assets',
				`Image src is not an absolute HTTPS URL: ${src.slice(0, 80)}. Relative paths, data: URIs and cid: attachments do not work.`
			);
		}

		if (/\.svg(\?|$)/i.test(src)) {
			add(ERROR, 'assets', `SVG image: ${src}. Neither Outlook for Windows nor Gmail renders it.`);
		}

		if (/\.(webp|avif)(\?|$)/i.test(src) || /\bfm=(webp|avif)\b/i.test(src)) {
			add(ERROR, 'assets', `Modern image format: ${src}. Classic Outlook renders neither WebP nor AVIF.`);
		}

		/*
		 * The site's Sanity helper bakes in auto=format so browsers negotiate
		 * AVIF/WebP. Reaching for that helper instead of lib/image-url.mjs is an
		 * easy mistake and ships broken images to Outlook.
		 */
		if (/cdn\.sanity\.io/i.test(src) && /auto=format/i.test(src)) {
			add(
				ERROR,
				'assets',
				`Sanity URL uses auto=format: ${src.slice(0, 90)}. Email must pin the format. Use buildEmailImageUrl() from lib/image-url.mjs.`
			);
		}

		if (/cdn\.sanity\.io/i.test(src) && !/[?&]fm=/i.test(src)) {
			add(WARN, 'assets', `Sanity URL with no explicit fm= parameter: ${src.slice(0, 90)}`);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 6. Merge tags                                                               */
/* -------------------------------------------------------------------------- */

function checkMergeTags(html, add) {
	for (const tag of new Set(extractMergeTags(html))) {
		if (!isKnownMergeTag(tag)) {
			add(
				ERROR,
				'merge-tags',
				`Unrecognised merge tag *|${tag}|*. It will ship to inboxes as literal text. Check lib/merge-tags.mjs, and confirm the audience's own fields.`
			);
		}
	}

	for (const problem of unbalancedConditionals(html)) {
		add(ERROR, 'merge-tags', `${problem}. Mailchimp will swallow the rest of the email.`);
	}

	const blank = tagsBlankInTestSend(html);
	if (blank.length) {
		add(
			INFO,
			'merge-tags',
			`Will render blank in a test send: ${blank.map((t) => `*|${t}|*`).join(', ')}. Check with live merge preview.`
		);
	}

	/*
	 * A personalisation tag outside an IF block renders as nothing for every
	 * contact missing that field, which on an imported audience is most of them.
	 */
	const conditionalRegions = [...html.matchAll(/\*\|IF:[^|]*\|\*([\s\S]*?)\*\|END:IF\|\*/g)]
		.map((m) => m[0])
		.join('');

	for (const tag of ['FNAME', 'LNAME', 'PHONE', 'ADDRESS', 'BIRTHDAY']) {
		const token = `*|${tag}|*`;
		const total = html.split(token).length - 1;
		const guarded = conditionalRegions.split(token).length - 1;

		if (total > guarded) {
			add(
				ERROR,
				'merge-tags',
				`${token} used outside an *|IF:${tag}|* block. Contacts without the field get an empty gap. Use withFallback() from lib/merge-tags.mjs.`
			);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 7. Footer requirements                                                      */
/* -------------------------------------------------------------------------- */

function checkFooter(html, add) {
	const present = new Set(extractMergeTags(html));

	for (const required of REQUIRED_FOOTER_TAGS) {
		// ARCHIVE may legitimately appear as ARCHIVE_PAGE_URL inside our own <a>.
		const satisfied =
			present.has(required) || (required === 'ARCHIVE' && present.has('ARCHIVE_PAGE_URL'));

		if (!satisfied) {
			add(
				ERROR,
				'footer',
				`Required footer element missing: *|${required}|*. This is a legal and Mailchimp requirement, not a design choice.`
			);
		}
	}

	// The permission reminder is our own localised string, not a merge tag, so
	// it is checked structurally: some prose must sit in the green footer.
	const footerRegion = html.slice(html.lastIndexOf(color.gold) - 200);
	if (visibleText(footerRegion).length < 60) {
		add(WARN, 'footer', 'Footer looks unusually sparse; check the permission reminder survived.');
	}
}

/* -------------------------------------------------------------------------- */
/* 8. Size                                                                     */
/* -------------------------------------------------------------------------- */

function checkSize(html, add, delivered) {
	const bytes = Buffer.byteLength(html, 'utf8');
	const kb = (bytes / 1024).toFixed(1);

	if (bytes > budget.deliveredErrorBytes) {
		add(
			ERROR,
			'size',
			`${kb}KB exceeds Gmail's ~102KB clipping threshold. The footer is what gets cut, so unsubscribe disappears.`
		);
	} else if (!delivered && bytes > budget.compiledWarnBytes) {
		add(
			WARN,
			'size',
			`${kb}KB compiled, over the ${(budget.compiledWarnBytes / 1024).toFixed(0)}KB working target. Mailchimp adds tracking URLs and footer markup on top.`
		);
	} else {
		add(
			INFO,
			'size',
			`${kb}KB ${delivered ? 'delivered' : 'compiled'} (${((bytes / budget.deliveredErrorBytes) * 100).toFixed(0)}% of the clipping threshold).`
		);
	}
}

/* -------------------------------------------------------------------------- */
/* 9. Colour contrast                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Walks elements carrying an inline `color`, resolves the nearest ancestor
 * background, and measures the pair. Approximate by nature (email has no
 * cascade worth trusting), so a failure is reported as a warning unless the
 * pair is unambiguous.
 */
function checkContrast(html, add) {
	/*
	 * Open AND close tags, in source order, so the background stack pops.
	 *
	 * Tracking only opening tags leaks a background sideways: once the figure's
	 * stone placeholder is pushed, every later sibling inherits it, and body
	 * copy elsewhere on white gets measured against #e2ded5. That produces
	 * confident, precise, wrong failures, which are worse than no check.
	 */
	const openTags = [...html.matchAll(/<(\/?)(\w+)\b([^>]*)>/g)];
	const stack = [{ bg: color.white, tag: 'root' }];
	const seen = new Set();

	const VOID = /^(img|br|meta|link|input|hr|area|base|col|source|track|wbr)$/i;

	for (const match of openTags) {
		const [, closing, tagName, attrs] = match;

		if (closing) {
			// Pop back to (and past) the matching open tag.
			for (let i = stack.length - 1; i > 0; i -= 1) {
				if (stack[i].tag.toLowerCase() === tagName.toLowerCase()) {
					stack.length = i;
					break;
				}
			}
			continue;
		}

		const style = attr(attrs, 'style');
		const bgcolor = attr(attrs, 'bgcolor');

		const bg = styleValue(style, 'background-color') || bgcolor;
		const fg = styleValue(style, 'color');
		const sizeRaw = styleValue(style, 'font-size');
		const weightRaw = styleValue(style, 'font-weight');

		const currentBg = bg || stack[stack.length - 1].bg;

		if (!VOID.test(tagName)) {
			stack.push({ bg: currentBg, tag: tagName });
		}

		if (!fg) continue;

		/*
		 * Visually hidden text has no contrast requirement, and the preheader is
		 * deliberately white-on-white at 1px. Reporting it as a 1:1 failure
		 * would train everyone to ignore the contrast check, which is the one
		 * check that most needs to be believed.
		 */
		const hidden =
			/display:\s*none/i.test(style || '') ||
			/mso-hide:\s*all/i.test(style || '') ||
			/opacity:\s*0(?!\.)/i.test(style || '') ||
			/max-height:\s*0/i.test(style || '') ||
			/font-size:\s*0(?:px)?(?:;|$)/i.test(style || '');

		if (hidden) continue;

		const size = sizeRaw ? parseFloat(sizeRaw) : 16;
		if (size === 0) continue;
		const weight = weightRaw ? parseInt(weightRaw, 10) : 400;
		const key = `${fg}|${currentBg}|${size}`;

		if (seen.has(key)) continue;
		seen.add(key);

		const ratio = contrastRatio(fg, currentBg);
		if (ratio === null) continue;

		const min = requiredRatio(size, weight >= 700);

		if (ratio < min) {
			add(
				ERROR,
				'contrast',
				`${formatRatio(ratio)} for ${fg} on ${currentBg} at ${size}px (needs ${min}:1).`
			);
		}
	}

	/*
	 * Gold is a fill and an accent, never ink on a pale ground: #d6c3a3 on white
	 * is ~1.7:1. This catches it directly rather than relying on the walk above
	 * resolving the right ancestor background.
	 */
	for (const match of openTags) {
		const style = attr(match[2], 'style');
		const fg = styleValue(style, 'color');
		if (!fg) continue;

		const bg = styleValue(style, 'background-color');
		const isLightGround = bg ? contrastRatio(color.charcoal, bg) > 7 : false;

		if (bannedTextOnLight.includes(fg.toLowerCase()) && isLightGround) {
			add(ERROR, 'contrast', `${fg} used as text on the light ground ${bg}. Gold and ivory are fills, not ink.`);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 10. Heading order                                                           */
/* -------------------------------------------------------------------------- */

function checkHeadingOrder(html, add) {
	const headings = [...html.matchAll(/<h([1-6])\b/gi)].map((m) => Number(m[1]));

	const h1Count = headings.filter((h) => h === 1).length;
	if (h1Count === 0) add(ERROR, 'heading-order', 'No <h1>.');
	if (h1Count > 1) add(ERROR, 'heading-order', `${h1Count} <h1> elements; there must be exactly one.`);

	let previous = 0;
	for (const level of headings) {
		if (previous && level > previous + 1) {
			add(ERROR, 'heading-order', `Heading jumps from h${previous} to h${level}. Screen-reader outlines rely on the sequence.`);
		}
		previous = level;
	}
}

/* -------------------------------------------------------------------------- */
/* 11. Unsupported elements and CSS                                            */
/* -------------------------------------------------------------------------- */

const BANNED_ELEMENTS = [
	['script', 'Scripts are stripped by every client and flag the message as spam.'],
	['iframe', 'Not supported and a strong spam signal.'],
	['form', 'Stripped by most clients; the ones that keep it cannot submit.'],
	['input', 'Interactive controls do not work in email.'],
	['button', 'Use the table-based CTA; a <button> has no action here.'],
	['video', 'Use a poster image linking to the page.'],
	['audio', 'No client support.'],
	['object', 'No client support.'],
	['embed', 'No client support.'],
	['svg', 'Neither Outlook for Windows nor Gmail renders inline SVG.'],
	['canvas', 'Requires scripting.']
];

const BANNED_CSS = [
	[/display:\s*flex/i, 'Flexbox', 'Word’s engine has no support; the layout collapses in classic Outlook.'],
	[/display:\s*(inline-)?grid/i, 'CSS Grid', 'Same. Use tables for structure.'],
	[/position:\s*(absolute|fixed|sticky)/i, 'Positioning', 'Unsupported and unpredictable across clients.'],
	[/border-radius\s*:/i, 'border-radius', 'The GHI brand is zero-radius everywhere. This is a brand rule, not a client limitation.'],
	[/box-shadow\s*:/i, 'box-shadow', 'No shadows at rest on this brand, and poor client support.'],
	[/background-image\s*:\s*linear-gradient/i, 'Gradient', 'The brand has no gradients, and Outlook needs VML for them.'],
	[/@font-face/i, '@font-face', 'Load web fonts through the @import in main.css instead, so there is one place to change them.']
];

function checkUnsupportedElements(html, add) {
	for (const [element, why] of BANNED_ELEMENTS) {
		if (new RegExp(`<${element}\\b`, 'i').test(html)) {
			add(ERROR, 'unsupported', `<${element}> present. ${why}`);
		}
	}

	for (const [pattern, label, why] of BANNED_CSS) {
		if (pattern.test(html)) {
			add(ERROR, 'unsupported', `${label} used. ${why}`);
		}
	}

	// Layout tables must be marked presentational or screen readers announce
	// every structural table as a data table with rows and columns.
	const layoutTables = tags(html, 'table').filter((t) => !/role\s*=\s*"presentation"/i.test(t.attrs));
	if (layoutTables.length) {
		add(
			ERROR,
			'unsupported',
			`${layoutTables.length} <table> without role="presentation". Screen readers will announce them as data tables.`
		);
	}
}

/* -------------------------------------------------------------------------- */
/* 12. Language                                                                */
/* -------------------------------------------------------------------------- */

function checkLanguage(html, add) {
	const htmlTag = /<html\b([^>]*)>/i.exec(html);
	if (!htmlTag) return;

	const lang = attr(htmlTag[1], 'lang');
	const dir = attr(htmlTag[1], 'dir');

	if (!lang) {
		add(ERROR, 'language', 'No lang attribute on <html>. Screen readers pick the wrong voice.');
	}
	if (!dir) {
		add(WARN, 'language', 'No dir attribute on <html>.');
	}
	if (dir && !['ltr', 'rtl'].includes(dir)) {
		add(ERROR, 'language', `Invalid dir="${dir}".`);
	}
}

/* -------------------------------------------------------------------------- */
/* 13. Brand rules                                                             */
/* -------------------------------------------------------------------------- */

function checkBrandRules(html, add) {
	/*
	 * Emphasis Ladder rationing. The masthead and footer are chrome and do not
	 * count; the body gets at most one green band. Two greens stacked read as
	 * one heavy slab and burn the email's only landing point.
	 */
	/*
	 * A full-bleed band is identified by the `sm-gutter` class, which only the
	 * band-level components carry. Matching on the green fill alone would also
	 * count every primary CTA button, since those are green-filled cells too,
	 * and a perfectly correct email would be reported as having twice the bands
	 * it has.
	 */
	const bandCells = tags(html, 'td').filter(
		(t) => /sm-gutter/.test(t.attrs) && /background-color:\s*#1f3d34/i.test(t.attrs)
	);

	// Masthead is the first, footer the last; anything between is a body band.
	const bodyBands = Math.max(0, bandCells.length - 2);
	if (bodyBands > budget.maxGreenBandsPerBody) {
		add(
			ERROR,
			'brand',
			`${bodyBands} green bands in the body; the cap is ${budget.maxGreenBandsPerBody}. Reach down the Emphasis Ladder: whitespace, then a hairline rule, then photography.`
		);
	}

	/*
	 * A green band immediately above the green footer merges with it into a
	 * single slab, which defeats the bookend structure the whole dark-mode
	 * strategy rests on.
	 *
	 * The comparison is between the LAST BODY band (bandCells minus the footer,
	 * which is always the final one) and the last white section. Anchoring on
	 * the footer's own markup instead would compare the footer against itself
	 * and fail every correct email.
	 */
	if (bandCells.length >= 2) {
		const footerCell = bandCells[bandCells.length - 1];
		const lastBodyBand = bandCells[bandCells.length - 2];

		const lastWhiteSection = tags(html, 'td')
			.filter((t) => /sm-gutter/.test(t.attrs) && /background-color:\s*#ffffff/i.test(t.attrs))
			.pop();

		const isMasthead = lastBodyBand.index === bandCells[0].index;
		const whiteAfterBand = lastWhiteSection && lastWhiteSection.index > lastBodyBand.index;

		if (!isMasthead && !whiteAfterBand && lastBodyBand.index < footerCell.index) {
			add(
				ERROR,
				'brand',
				'A green band sits immediately above the green footer. They merge into one slab. Close the body on white, or move the band up.'
			);
		}
	}

	/*
	 * Overlines. One per email is a brand mark; one above every heading is
	 * scaffolding that reads as a template rather than a voice.
	 */
	const overlines = [...html.matchAll(/text-transform:\s*uppercase/gi)].length;
	if (overlines > budget.maxOverlinesPerEmail) {
		add(
			WARN,
			'brand',
			`${overlines} uppercase overlines; the cap is ${budget.maxOverlinesPerEmail}. A tracked label above every section is AI scaffolding, not brand voice.`
		);
	}

	/*
	 * Links must be underlined at rest. Email has no hover, so colour would
	 * otherwise be the only signal a link is a link (WCAG 1.4.1).
	 */
	for (const a of tags(html, 'a')) {
		const style = attr(a.attrs, 'style') || '';
		const isButton = /display:\s*block/i.test(style);
		const isImageWrap = /border:\s*0/i.test(style) && !/color:/i.test(style);

		if (isButton || isImageWrap) continue;

		if (!/text-decoration:\s*underline/i.test(style)) {
			const href = attr(a.attrs, 'href') || '';
			add(
				WARN,
				'brand',
				`Link not underlined at rest: ${href.slice(0, 60)}. Colour alone cannot identify a link.`
			);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 14. RTL symmetry                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Horizontal padding must be symmetric.
 *
 * Email cannot use logical properties (`padding-inline-start`), because Word's
 * engine does not support them, so asymmetric horizontal padding cannot mirror
 * for a right-to-left locale. Keeping every component symmetric is what makes
 * Arabic a one-attribute change rather than a parallel stylesheet.
 */
function checkRtlSymmetry(html, add) {
	for (const td of tags(html, 'td')) {
		const style = attr(td.attrs, 'style');
		const padding = styleValue(style, 'padding');
		if (!padding) continue;

		const parts = padding.trim().split(/\s+/);
		// Only the 4-value form can be horizontally asymmetric.
		if (parts.length !== 4) continue;

		if (parts[1] !== parts[3]) {
			add(
				ERROR,
				'rtl',
				`Asymmetric horizontal padding (${padding}). It cannot mirror for right-to-left locales, and email has no logical properties.`
			);
		}
	}
}

/* -------------------------------------------------------------------------- */
/* 15. Plain-text completeness                                                 */
/* -------------------------------------------------------------------------- */

function checkPlaintext(html, text, add) {
	if (!text || !text.trim()) {
		add(ERROR, 'plaintext', 'Plain-text alternative is empty.');
		return;
	}

	/*
	 * Entity-decoded before comparing. The HTML carries `&amp;` inside query
	 * strings; the text version carries a literal `&`. Comparing the raw forms
	 * reports every UTM-tagged link as missing.
	 */
	const decode = (url) => url.replace(/&amp;/gi, '&').replace(/&#0?38;/g, '&');

	const htmlLinks = new Set(
		[...html.matchAll(/<a\b[^>]*href\s*=\s*"(https:\/\/[^"]*)"/gi)].map((m) => decode(m[1]))
	);

	for (const link of htmlLinks) {
		if (!text.includes(link)) {
			add(ERROR, 'plaintext', `Link missing from the plain-text version: ${link.slice(0, 70)}`);
		}
	}

	for (const required of REQUIRED_FOOTER_TAGS) {
		if (required === 'ARCHIVE') continue;
		if (!text.includes(`*|${required}|*`)) {
			add(ERROR, 'plaintext', `Plain-text version is missing *|${required}|*.`);
		}
	}

	// Case-insensitive: the text version sets headings in caps.
	const textUpper = text.toUpperCase();

	for (const h of [...html.matchAll(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]>/gi)]) {
		const heading = visibleText(h[1]);
		if (heading && !textUpper.includes(heading.toUpperCase())) {
			add(WARN, 'plaintext', `Heading missing from the plain-text version: "${heading.slice(0, 50)}"`);
		}
	}

	const htmlWords = visibleText(html).split(/\s+/).length;
	const textWords = text.split(/\s+/).length;

	if (textWords < htmlWords * 0.6) {
		add(
			WARN,
			'plaintext',
			`Plain-text version has ${textWords} words against ${htmlWords} in the HTML; it may be missing content.`
		);
	}
}
