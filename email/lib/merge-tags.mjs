/**
 * Mailchimp merge-tag registry.
 *
 * Two jobs:
 *   1. The validator checks every `*|...|*` in a build against this list, so a
 *      typo like `*|UNSUBSCRIBE|*` fails at build time instead of shipping a
 *      literal string to an inbox.
 *   2. It records which tags populate in a test send and which do not, because
 *      that distinction is the single most common cause of "the personalisation
 *      looked broken" during review.
 *
 * IMPORTANT: audience merge tags are per-audience. `FNAME` exists because
 * someone created it on that audience; it is not guaranteed. Before the first
 * real send, confirm the audience's actual tags under
 * Audience > Settings > Audience fields and *|MERGE|* tags, and reconcile this
 * file with them. See docs/03-mailchimp.md.
 */

/** System tags. Present on every Mailchimp audience. */
export const SYSTEM_TAGS = {
	UNSUB: {
		description: 'Unsubscribe URL. Required in the footer.',
		populatesInTestSend: true,
		required: true
	},
	UPDATE_PROFILE: {
		description: 'Update-preferences URL. Required in the footer.',
		populatesInTestSend: true,
		required: true
	},
	'LIST:ADDRESS': {
		description: 'Physical mailing address, plain. Required by law and by Mailchimp.',
		populatesInTestSend: true,
		required: true
	},
	'LIST:ADDRESSLINE': {
		description: 'Physical mailing address on one line, pipe-separated.',
		populatesInTestSend: true,
		required: false
	},
	'HTML:LIST_ADDRESS_HTML': {
		description: 'Pre-formatted address block. Mailchimp injects its own markup.',
		populatesInTestSend: true,
		required: false
	},
	'LIST:DESCRIPTION': {
		description: 'Permission reminder set on the audience.',
		populatesInTestSend: true,
		required: false
	},
	'LIST:COMPANY': { description: 'Audience company name.', populatesInTestSend: true },
	'LIST:NAME': { description: 'Audience name.', populatesInTestSend: true },
	'LIST:URL': { description: 'Audience website URL.', populatesInTestSend: true },
	'LIST:EMAIL': { description: 'Audience contact email.', populatesInTestSend: true },
	'LIST:SUBSCRIBE': { description: 'Signup URL for forwarded copies.', populatesInTestSend: true },
	ARCHIVE: {
		description: 'View-in-browser link. Renders a full <a> element, not a URL.',
		populatesInTestSend: true,
		required: true
	},
	'ARCHIVE_PAGE_URL': {
		description: 'View-in-browser URL only, for use in your own <a href>.',
		populatesInTestSend: true
	},
	'MC:SUBJECT': { description: 'Campaign subject line.', populatesInTestSend: true },
	MC_PREVIEW_TEXT: {
		description: 'Preview text set on the campaign. We render our own preheader instead.',
		populatesInTestSend: true
	},
	'MC:TOFRIEND': { description: 'Forward-to-a-friend URL.', populatesInTestSend: true },
	FORWARD: { description: 'Forward-to-a-friend link.', populatesInTestSend: true },
	REWARDS: { description: 'Mailchimp referral badge. Free plans only.', populatesInTestSend: true },
	MC_LANGUAGE: { description: "Contact's language code.", populatesInTestSend: false },
	'DATE:Y': { description: 'Current year.', populatesInTestSend: true },
	CURRENT_YEAR: { description: 'Current year.', populatesInTestSend: true }
};

/**
 * Audience (contact) tags. These do NOT populate in an ordinary test send;
 * Mailchimp substitutes blanks. Verify them with Preview & Test > Enter preview
 * mode > Live merge tag info, or with a controlled live segment.
 */
export const AUDIENCE_TAGS = {
	EMAIL: { description: 'Contact email address.', populatesInTestSend: false },
	FNAME: { description: 'First name. Confirm it exists on the target audience.', populatesInTestSend: false },
	LNAME: { description: 'Last name. Confirm it exists on the target audience.', populatesInTestSend: false },
	PHONE: { description: 'Phone number.', populatesInTestSend: false },
	ADDRESS: { description: 'Contact address.', populatesInTestSend: false },
	BIRTHDAY: { description: 'Contact birthday.', populatesInTestSend: false }
};

/** Conditional-block syntax. Matched structurally, not by name. */
export const CONDITIONAL_PATTERNS = [
	/^IF:/,
	/^ELSEIF:/,
	/^ELSE:$/,
	/^END:IF$/,
	/^INTERESTED:/,
	/^END:INTERESTED$/,
	/^UNSUB:/, // *|UNSUB:https://...|* custom unsubscribe target
	/^MERGE\d+$/ // positional merge fields
];

/** Every tag the footer must contain for the build to pass. */
export const REQUIRED_FOOTER_TAGS = Object.entries(SYSTEM_TAGS)
	.filter(([, meta]) => meta.required)
	.map(([name]) => name);

const KNOWN = new Set([...Object.keys(SYSTEM_TAGS), ...Object.keys(AUDIENCE_TAGS)]);

/** Every `*|...|*` occurrence in a string. */
export function extractMergeTags(html) {
	return [...html.matchAll(/\*\|([^|*]+)\|\*/g)].map((m) => m[1].trim());
}

/**
 * Is this tag name recognised?
 * @param {string} name
 */
export function isKnownMergeTag(name) {
	if (KNOWN.has(name)) return true;
	return CONDITIONAL_PATTERNS.some((pattern) => pattern.test(name));
}

/**
 * Tags in the given HTML that will render blank in a test send. Used by the
 * validator to print a reviewer warning rather than an error.
 * @param {string} html
 */
export function tagsBlankInTestSend(html) {
	return [...new Set(extractMergeTags(html))].filter((name) => {
		const meta = SYSTEM_TAGS[name] ?? AUDIENCE_TAGS[name];
		return meta ? meta.populatesInTestSend === false : false;
	});
}

/**
 * Check that conditional blocks are balanced. An unclosed `*|IF:|*` silently
 * swallows the rest of the email in Mailchimp's renderer.
 * @param {string} html
 */
export function unbalancedConditionals(html) {
	const tags = extractMergeTags(html);
	const problems = [];

	let ifDepth = 0;
	let interestedDepth = 0;

	for (const tag of tags) {
		if (/^IF:/.test(tag)) ifDepth += 1;
		else if (/^END:IF$/.test(tag)) ifDepth -= 1;
		else if (/^INTERESTED:/.test(tag)) interestedDepth += 1;
		else if (/^END:INTERESTED$/.test(tag)) interestedDepth -= 1;

		if (ifDepth < 0) problems.push('*|END:IF|* without a matching *|IF:...|*');
		if (interestedDepth < 0) problems.push('*|END:INTERESTED|* without a matching *|INTERESTED:...|*');
	}

	if (ifDepth > 0) problems.push(`${ifDepth} unclosed *|IF:...|* block(s)`);
	if (interestedDepth > 0) problems.push(`${interestedDepth} unclosed *|INTERESTED:...|* block(s)`);

	return [...new Set(problems)];
}

/**
 * Wrap a personalisation tag with a fallback. A bare `*|FNAME|*` in a greeting
 * renders "Dear ," for every contact missing the field, which is most of them
 * on an imported audience.
 *
 * @param {string} tag e.g. 'FNAME'
 * @param {string} value the text when present
 * @param {string} fallback the text when absent
 */
export function withFallback(tag, value, fallback) {
	return `*|IF:${tag}|*${value}*|ELSE:|*${fallback}*|END:IF|*`;
}
