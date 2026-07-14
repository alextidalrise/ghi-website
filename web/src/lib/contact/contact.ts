/**
 * The single place the GHI phone number lives.
 *
 * It was previously written out by hand on /contact and /soon, while EnquiryRail and
 * TalkToUsBand rendered fully-styled WhatsApp buttons that did nothing (`whatsAppHref`
 * was hard-coded to null pending the number). One number, one module, so a change of line
 * is a one-line change and no surface can drift back to a dead button.
 */

/** Digits only, as wa.me requires: no plus, no spaces. */
const WHATSAPP_NUMBER = '447496443109';

/** Human-readable, for display. Set in tabular numerals wherever it is shown. */
export const PHONE_DISPLAY = '+44 7496 443109';

/** Calls or texts the same line. */
export const PHONE_HREF = 'tel:+447496443109';

/** A WhatsApp deep link that opens the chat with `message` already typed. */
export function whatsAppHref(message: string): string {
	return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * The opener for a listing enquiry. The GHI reference rides along when the listing has
 * one, so the chat lands with the team already knowing which property is being asked
 * about — the whole reason to prefill rather than open an empty thread.
 */
export function listingWhatsAppMessage(reference?: string | null): string {
	const ref = reference?.trim();
	return ref
		? `Hello, I'd like to enquire about ${ref} with Golf Homes International.`
		: "Hello, I'd like to enquire about a property with Golf Homes International.";
}

/** The opener from a general enquiry surface (contact page, closing CTA band). */
export const GENERAL_WHATSAPP_MESSAGE =
	"Hello, I'd like to enquire about a property with Golf Homes International.";

/** The opener from the /soon advisor path. */
export const ADVISOR_WHATSAPP_MESSAGE =
	"Hello, I'd like to speak to an advisor about Golf Homes International.";
