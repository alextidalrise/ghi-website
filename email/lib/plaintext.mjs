/**
 * Plain-text alternative generation.
 *
 * Mailchimp will generate one automatically. It should not be accepted without
 * review: it strips structure indiscriminately, drops link destinations into
 * bare URLs with no context, and has no idea which parts of the email were
 * required footer content.
 *
 * This derives the text version from the same built HTML, deterministically, so
 * the two are always in step. Both are sent together as multipart/alternative.
 *
 * Deterministic matters for the agent path: the same HTML in must always give
 * the same text out, or a campaign diff becomes unreviewable.
 */

import { loadLocale } from './locales.mjs';

const WRAP_AT = 72;

/**
 * @param {string} html   built email HTML
 * @param {object} [options]
 * @param {string} [options.locale]
 * @returns {string}
 */
export function generatePlaintext(html, { locale = 'en' } = {}) {
	const i18n = loadLocale(locale);
	const body = extractBody(html);
	const blocks = [];

	/*
	 * Header: the wordmark as text, since the logo cannot come through, plus the
	 * destination the masthead logo links to. That link is real and tracked, so
	 * it belongs in the text version too; the masthead itself is excluded from
	 * the walk below.
	 */
	blocks.push(i18n.plaintext.footerHeading.toUpperCase());
	blocks.push(mastheadHref(html) ?? '');
	blocks.push(rule('='));

	for (const block of walk(body)) {
		if (block.type === 'heading') {
			blocks.push('');
			blocks.push(block.text.toUpperCase());
			blocks.push(rule('-', Math.min(block.text.length, WRAP_AT)));
		} else if (block.type === 'paragraph') {
			blocks.push('');
			blocks.push(wrap(block.text));
		} else if (block.type === 'cta') {
			blocks.push('');
			blocks.push(wrap(`${block.text.toUpperCase()}: ${block.href}`));
		} else if (block.type === 'image') {
			// A described image is content; a decorative one is noise.
			if (block.alt) {
				blocks.push('');
				blocks.push(wrap(`[${i18n.plaintext.imageLabel}: ${block.alt}]`));
			}
		} else if (block.type === 'rule') {
			blocks.push('');
			blocks.push(rule('-'));
		}
	}

	blocks.push('');
	blocks.push(rule('='));
	blocks.push('');

	/*
	 * The footer is rebuilt rather than scraped. Its requirements are legal, and
	 * a scrape would silently lose one the moment the markup changes.
	 */
	blocks.push(wrap(i18n.permissionReminder));
	blocks.push('');
	blocks.push('*|LIST:COMPANY|*, *|LIST:ADDRESS|*');
	blocks.push('');
	blocks.push(`${i18n.viewInBrowser}: *|ARCHIVE_PAGE_URL|*`);
	blocks.push(`${i18n.updatePreferences}: *|UPDATE_PROFILE|*`);
	blocks.push(`${i18n.unsubscribe}: *|UNSUB|*`);
	blocks.push('');
	blocks.push(`(c) *|CURRENT_YEAR|* Golf Homes International. ${i18n.footerRights}`);

	return `${blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`;
}

/* -------------------------------------------------------------------------- */

/**
 * The campaign body: everything between the masthead and the footer.
 *
 * Both of those are rebuilt from the locale rather than scraped, because their
 * content is required and a scrape would silently lose a legal element the
 * moment the markup changed. Walking them as well would print the wordmark
 * twice and the permission reminder twice.
 *
 * The boundaries are the first and last full-bleed green cells, which are the
 * masthead and footer by construction. `sm-gutter` marks a band-level cell,
 * which distinguishes them from the green-filled CTA button cells.
 */
function extractBody(html) {
	const match = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html);
	let body = match ? match[1] : html;

	body = body
		// The hidden preheader duplicates the subject; it is not body content.
		.replace(/<div[^>]*mso-hide:\s*all[\s\S]*?<\/div>/gi, '')
		.replace(/<!--[\s\S]*?-->/g, '')
		.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '');

	const bands = [
		...body.matchAll(/<td\b[^>]*(?:sm-gutter[^>]*background-color:\s*#1f3d34|background-color:\s*#1f3d34[^>]*sm-gutter)[^>]*>/gi)
	];

	if (bands.length >= 2) {
		const masthead = bands[0];
		const footer = bands[bands.length - 1];

		// Trim from the end of the masthead cell to the start of the footer's
		// preceding hairline.
		const start = masthead.index + masthead[0].length;
		const end = footer.index;

		if (end > start) body = body.slice(start, end);
	}

	return body;
}

/**
 * Pull out the blocks that carry meaning, in source order. Source order is the
 * reading order by construction in this system, which is what makes this safe.
 *
 * Works over LEAF cells only: a `<td>` that contains no further `<td>`. In this
 * system every piece of copy, every heading, every image and every CTA lives in
 * a leaf cell, and the enclosing cells are pure structure.
 *
 * The obvious alternative, one alternating regex over headings/images/links/
 * cells, does not work: an outer `<td>` starts earlier in the source than the
 * `<h1>` inside it, so the cell matches first, consumes the heading, and every
 * heading and CTA silently disappears from the text version. Matching leaves
 * only and then classifying each leaf avoids the whole problem.
 */
function* walk(body) {
	const emitted = new Set();

	// `(?:(?!<td)[\s\S])*?` refuses to cross another opening cell, so this only
	// ever matches innermost cells.
	const leafCell = /<td\b([^>]*)>((?:(?!<td)[\s\S])*?)<\/td>/gi;

	let match;

	while ((match = leafCell.exec(body)) !== null) {
		const attrs = match[1] || '';
		const inner = match[2];

		// A 1px filled cell is a hairline rule, not a paragraph.
		if (/height:\s*1px/i.test(attrs)) {
			yield { type: 'rule' };
			continue;
		}

		/*
		 * Spacer cells hold a single non-breaking space and nothing else. The
		 * image test comes first: the figure cell also carries `font-size: 0`
		 * (to kill the inline-image gap), and its <img> cleans to an empty
		 * string, so checking the spacer rule first silently drops every hero
		 * image from the text version.
		 */
		if (!/<img\b/i.test(inner) && /font-size:\s*0/i.test(attrs) && !clean(inner)) continue;

		// Footer copy is rebuilt from the locale below, so skip it here.
		if (/\*\|(UNSUB|UPDATE_PROFILE|LIST:ADDRESS|ARCHIVE_PAGE_URL|CURRENT_YEAR)\|\*/.test(inner)) {
			continue;
		}

		const heading = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/i.exec(inner);
		if (heading) {
			const text = clean(heading[2]);
			if (text) yield { type: 'heading', text };
			continue;
		}

		const image = /<img\b([^>]*)>/i.exec(inner);
		if (image) {
			const alt = attrOf(image[1], 'alt');
			yield { type: 'image', alt: alt ? clean(alt) : '' };
			continue;
		}

		// A CTA is an anchor rendered as a block: the button construction.
		const cta = /<a\b([^>]*display:\s*block[^>]*)>([\s\S]*?)<\/a>/i.exec(inner);
		if (cta) {
			const href = attrOf(cta[1], 'href');
			const text = clean(cta[2]);
			if (text && href) yield { type: 'cta', text, href: decodeEntities(href) };
			continue;
		}

		const text = withInlineLinks(inner);
		if (!text) continue;

		const key = text.slice(0, 60);
		if (emitted.has(key)) continue;
		emitted.add(key);

		yield { type: 'paragraph', text };
	}
}

/**
 * Inline links become "label (url)" rather than a bare URL, so the destination
 * is readable without losing the sentence it sat in.
 */
function withInlineLinks(html) {
	const resolved = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (_, attrs, label) => {
		const href = attrOf(attrs, 'href');
		const text = clean(label);
		if (!href || /^\*\|/.test(href)) return text;
		// Decoded here, so the URL is already literal before clean() runs over it.
		return `${text} (${decodeEntities(href)})`;
	});

	return clean(resolved);
}

/** The destination behind the masthead logo, so it survives into plain text. */
function mastheadHref(html) {
	const m = /<a\b[^>]*href\s*=\s*"(https:\/\/[^"]*)"[^>]*>\s*<img/i.exec(html);
	return m ? decodeEntities(m[1]) : null;
}

/** Decode the entity set that can legitimately appear inside a URL. */
function decodeEntities(value) {
	return value
		.replace(/&amp;/gi, '&')
		.replace(/&#0?38;/g, '&')
		.replace(/&quot;/gi, '"')
		.replace(/&#0?39;|&apos;/gi, "'");
}

function attrOf(attrString, name) {
	const m = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrString);
	return m ? m[1] : null;
}

function clean(html) {
	return html
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/&lt;/gi, '<')
		.replace(/&gt;/gi, '>')
		.replace(/&quot;/gi, '"')
		.replace(/&#0?39;|&apos;/gi, "'")
		.replace(/&copy;/gi, '(c)')
		.replace(/&middot;/gi, '-')
		.replace(/&[a-z]+;|&#\d+;/gi, '')
		.replace(/[ \t]+/g, ' ')
		.replace(/\s*\n\s*/g, ' ')
		.trim();
}

function rule(char, length = WRAP_AT) {
	return char.repeat(length);
}

/** Wrap without breaking words or splitting a URL across lines. */
function wrap(text, width = WRAP_AT) {
	const words = text.split(/\s+/);
	const lines = [];
	let line = '';

	for (const word of words) {
		if (!line) {
			line = word;
		} else if (`${line} ${word}`.length <= width) {
			line += ` ${word}`;
		} else {
			lines.push(line);
			line = word;
		}
	}

	if (line) lines.push(line);
	return lines.join('\n');
}
