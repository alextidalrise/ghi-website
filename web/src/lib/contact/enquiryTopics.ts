/**
 * Pre-framed enquiries, opened from anywhere on the site with `/contact?enquiry=<key>`.
 *
 * The problem this solves is the same one `?partner=<slug>` solves for introductions: a
 * visitor clicks a button that says exactly what they want, and the form opens blank,
 * so the site asks them to type the sentence they just clicked. A topic gives the form
 * its opening message, names the enquiry above it, and rides along to the team so the
 * lead arrives with its context.
 *
 * **The vocabulary is closed on purpose.** A free-text `?message=` parameter would let
 * any link — including one a stranger crafts and sends to a buyer — put words into a
 * form that visitor is about to send under their own name. That is the same class of
 * problem `safePageLocation` guards against in analytics, and the answer is the same: a
 * key resolves to copy we wrote, or to nothing at all. Anything unrecognised falls back
 * to the plain enquiry form, exactly as an unknown partner slug does.
 *
 * Adding a topic is one entry here. The message is a starting point the visitor can edit,
 * never a locked value, so it must read as something they would have written themselves.
 */

/** The query-param key `enquiryTopicHref` writes and /contact reads. */
export const ENQUIRY_TOPIC_PARAM = 'enquiry';

type EnquiryTopicCopy = {
	/** The message the form opens with, in the visitor's voice. Editable once there. */
	message: string;
	/** Panel heading, in place of the generic "Send an enquiry". */
	heading: string;
	/** One line under the heading saying what this enquiry is. `{name}` becomes the advisor. */
	intro: string;
	/** Success heading, so the confirmation answers the request that was actually made. */
	confirmHeading: string;
	/**
	 * Recorded ahead of the message on the submission so the team can route it. The HubSpot
	 * form exposes only firstname/email/phone/message, so — as with an introduction request
	 * — this rides in the message body rather than needing a new field provisioned.
	 */
	label: string;
};

/**
 * Every topic the site can link to. Keys are URL-facing and permanent: changing one
 * breaks any link already published in an article.
 */
const ENQUIRY_TOPICS = {
	'monte-rei-shortlist': {
		message: 'Please send me a current shortlist for Monte Rei.',
		heading: 'Request a Monte Rei shortlist',
		intro:
			'Add your budget, intended use and timescale, and {name} will come back with what is currently available.',
		confirmHeading: 'Thank you, your shortlist request is with us',
		label: 'Monte Rei — shortlist requested'
	},
	'nobu-monte-rei-updates': {
		message: 'Please keep me updated on the Nobu residences at Monte Rei.',
		heading: 'Register for Nobu updates',
		intro:
			'{name} will send the residential terms once they are formally released, and nothing before then.',
		confirmHeading: 'Thank you, we will keep you posted',
		label: 'Nobu at Monte Rei — updates requested'
	}
} as const satisfies Record<string, EnquiryTopicCopy>;

export type EnquiryTopicKey = keyof typeof ENQUIRY_TOPICS;

/** A topic resolved from the URL, with `{name}` already filled in. */
export type EnquiryTopic = EnquiryTopicCopy & { key: EnquiryTopicKey };

function isTopicKey(value: string): value is EnquiryTopicKey {
	return Object.hasOwn(ENQUIRY_TOPICS, value);
}

/**
 * Resolve `?enquiry=<key>`. Returns null for anything unrecognised — a stale link, a
 * typo, or a crafted one — so the page falls back to the plain enquiry form.
 *
 * `advisorFirstName` fills the `{name}` token, matching how `resolveContactContent`
 * handles the Sanity-authored `formIntro`.
 */
export function resolveEnquiryTopic(
	value: string | null | undefined,
	advisorFirstName: string
): EnquiryTopic | null {
	if (!value || !isTopicKey(value)) return null;
	const copy = ENQUIRY_TOPICS[value];
	return { ...copy, key: value, intro: copy.intro.replace('{name}', advisorFirstName) };
}

/** Buyer-facing link that opens the contact form on a given topic. */
export function enquiryTopicHref(key: EnquiryTopicKey): string {
	return `/contact?${ENQUIRY_TOPIC_PARAM}=${encodeURIComponent(key)}`;
}

/**
 * The label recorded ahead of the visitor's message on a submission. Resolved from the
 * posted key server-side rather than trusted from a hidden field, so what reaches the
 * team is copy we wrote.
 */
export function enquiryTopicLabel(value: string | null | undefined): string | null {
	if (!value || !isTopicKey(value)) return null;
	return ENQUIRY_TOPICS[value].label;
}
