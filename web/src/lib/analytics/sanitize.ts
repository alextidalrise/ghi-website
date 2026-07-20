import type { DataLayerEvent, GhiEventName } from './types';

/**
 * The privacy backstop.
 *
 * Every payload passes through here before it reaches `window.dataLayer`. The design is
 * allowlist-first, which is only viable because we construct every payload ourselves —
 * the key space is finite and known. A blocklist alone would be brittle in both
 * directions: `item_name` contains "name" and `page_location` contains "location", so
 * naive substring blocking produces false positives, while a genuinely new PII field
 * nobody thought to blocklist would sail through.
 *
 * Pure and free of DOM access so the whole contract is testable in Node.
 */

/** Event names the application is allowed to emit. Anything else is dropped whole. */
export const ALLOWED_EVENTS: ReadonlySet<GhiEventName> = new Set<GhiEventName>([
	'ghi_virtual_page_view',
	'ghi_search_submitted',
	'ghi_listing_list_viewed',
	'ghi_listing_selected',
	'ghi_listing_viewed',
	'ghi_gallery_opened',
	'ghi_gallery_image_viewed',
	'ghi_floorplan_request_started',
	'ghi_contact_clicked',
	'ghi_lead_submitted'
]);

/** The exact union of top-level keys the typed builders in `events.ts` can produce. */
export const ALLOWED_KEYS: ReadonlySet<string> = new Set([
	'event',
	// page view
	'page_location',
	'page_path',
	'page_title',
	'page_type',
	// listing identity
	'listing_id',
	'listing_kind',
	// search
	'search_placement',
	'country',
	'location',
	'community',
	'property_type',
	'price_band',
	'min_beds',
	'sort',
	'selected_features',
	'golf_relevance',
	// lists
	'item_list_id',
	'item_list_name',
	'items',
	// gallery
	'image_position',
	'image_count',
	'gallery_surface',
	'navigation_method',
	// contact and leads
	'contact_method',
	'placement',
	'lead_type',
	'form_location'
]);

/** Keys permitted inside a GA4 `items[]` entry. */
export const ITEM_ALLOWED_KEYS: ReadonlySet<string> = new Set([
	'item_id',
	'item_name',
	'item_brand',
	'item_category',
	'item_category2',
	'item_category3',
	'item_category4',
	'price',
	'currency',
	'item_list_id',
	'item_list_name',
	'index'
]);

/**
 * Keys that legitimately contain a blocklisted word. Checked before the patterns so a
 * safe key is never rejected for containing "name" or "location".
 */
const SAFE_KEYS: ReadonlySet<string> = new Set([
	'item_name',
	'item_list_name',
	'page_location',
	'page_path',
	'page_title',
	'location'
]);

/**
 * Prohibited field names, per the brief. Kept as a second net behind the allowlist:
 * it produces a far clearer error when someone adds a PII field to `events.ts` and
 * extends `ALLOWED_KEYS` to match without thinking it through.
 */
const BLOCKED_KEY_PATTERNS: readonly RegExp[] = [
	/^(first|last|full)?_?name$/,
	/e-?mail/,
	/phone|telephone|mobile|msisdn/,
	/message|comment|enquiry_text|notes?$/,
	/address|street|postcode|postal|zip/,
	/^ip$|ip_address|client_ip/,
	/hubspot|^hs_|contact_id|hutk/,
	/^_id$|sanity|document_id|source_ref|internal_note/,
	/dob|birth/
];

const EMAIL_VALUE = /[^\s@]+@[^\s@]+\.[^\s@]+/;
/** Seven or more digits with optional separators — a phone number in any format. */
const PHONE_VALUE = /(?:\+?\d[\s\-().]?){7,}/;

/**
 * Keys whose values are numeric by construction and would trip the phone heuristic.
 *
 * `price_band` is a synthesised range like `500000-1000000`, built by us from a closed
 * set of budget bands — it can never contain a visitor's phone number, but it does look
 * like one to a digit-run regex. Exempting it by key is safer than loosening the pattern
 * for every field.
 */
const PHONE_EXEMPT: ReadonlySet<string> = new Set(['price_band']);

/**
 * Free-text ceiling. Anything longer is almost certainly prose a visitor typed rather
 * than a dimension value. Titles are exempt — they are editorial copy, not user input.
 */
const MAX_VALUE_LENGTH = 120;
const LENGTH_EXEMPT: ReadonlySet<string> = new Set(['page_title', 'page_location', 'item_name']);

export type Violation = {
	key: string;
	kind: 'unknown_key' | 'blocked_key' | 'email_value' | 'phone_value' | 'freetext_value';
};

/** Inspect one key/value pair. Returns null when it is safe to send. */
export function findViolation(key: string, value: unknown): Violation | null {
	if (!SAFE_KEYS.has(key)) {
		const lower = key.toLowerCase();
		if (BLOCKED_KEY_PATTERNS.some((pattern) => pattern.test(lower))) {
			return { key, kind: 'blocked_key' };
		}
	}

	if (!ALLOWED_KEYS.has(key)) {
		return { key, kind: 'unknown_key' };
	}

	if (typeof value === 'string') {
		if (EMAIL_VALUE.test(value)) return { key, kind: 'email_value' };
		if (!PHONE_EXEMPT.has(key) && PHONE_VALUE.test(value)) return { key, kind: 'phone_value' };
		if (!LENGTH_EXEMPT.has(key) && value.length > MAX_VALUE_LENGTH) {
			return { key, kind: 'freetext_value' };
		}
	}

	return null;
}

/** Drop keys that carry nothing — GTM should never see an empty dimension. */
function isEmpty(value: unknown): boolean {
	return (
		value === undefined ||
		value === null ||
		value === '' ||
		(Array.isArray(value) && value.length === 0)
	);
}

function sanitizeItem(raw: unknown): Record<string, unknown> | null {
	if (typeof raw !== 'object' || raw === null) return null;

	const clean: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(raw)) {
		if (!ITEM_ALLOWED_KEYS.has(key)) continue;
		if (isEmpty(value)) continue;
		// Item names are editorial copy, but must still never carry contact details.
		if (typeof value === 'string' && (EMAIL_VALUE.test(value) || PHONE_VALUE.test(value))) {
			continue;
		}
		clean[key] = value;
	}

	return clean.item_id ? clean : null;
}

export type SanitizeResult = {
	/** Null when the event itself is unusable and must not be pushed. */
	event: DataLayerEvent | null;
	violations: Violation[];
};

/**
 * Strip anything unsafe or empty from an event.
 *
 * `strict` (development) makes the caller throw so a leak breaks the page immediately at
 * the call site. In production we drop the offending keys and push the remainder —
 * losing a dimension is much better than losing a conversion count.
 */
export function sanitizeEvent(input: DataLayerEvent): SanitizeResult {
	const violations: Violation[] = [];

	const name = input?.event;
	if (!name || !ALLOWED_EVENTS.has(name)) {
		return { event: null, violations: [{ key: 'event', kind: 'unknown_key' }] };
	}

	const clean: Record<string, unknown> = { event: name };

	for (const [key, value] of Object.entries(input)) {
		if (key === 'event') continue;
		if (isEmpty(value)) continue;

		if (key === 'items') {
			const items = Array.isArray(value)
				? value.map(sanitizeItem).filter((item): item is Record<string, unknown> => item !== null)
				: [];
			if (items.length > 0) clean.items = items;
			continue;
		}

		const violation = findViolation(key, value);
		if (violation) {
			violations.push(violation);
			continue;
		}

		clean[key] = value;
	}

	return { event: clean as DataLayerEvent, violations };
}
