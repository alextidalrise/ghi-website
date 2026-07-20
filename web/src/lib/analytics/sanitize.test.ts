import { execSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { findViolation, sanitizeEvent } from './sanitize';
import type { DataLayerEvent } from './types';

const pageView = (extra: Record<string, unknown> = {}): DataLayerEvent =>
	({
		event: 'ghi_virtual_page_view',
		page_path: '/spain/marbella',
		page_type: 'location',
		...extra
	}) as DataLayerEvent;

describe('findViolation', () => {
	it('blocks the prohibited field names from the brief', () => {
		const prohibited = [
			'name',
			'first_name',
			'email',
			'user_email',
			'phone',
			'telephone',
			'message',
			'enquiry_text',
			'street_address',
			'postcode',
			'ip',
			'ip_address',
			'hubspot_contact_id',
			'hutk',
			'_id',
			'sanity_ref',
			'source_ref',
			'internal_note',
			'date_of_birth'
		];
		for (const key of prohibited) {
			expect(findViolation(key, 'x')?.kind, key).toBe('blocked_key');
		}
	});

	it('allows the safe keys that merely contain a blocked word', () => {
		expect(findViolation('item_list_name', 'Featured listings')).toBeNull();
		expect(findViolation('page_location', 'https://golfhomesinternational.com/spain')).toBeNull();
		expect(findViolation('page_title', 'Villas in Marbella')).toBeNull();
		expect(findViolation('location', 'marbella')).toBeNull();
	});

	it('rejects item-scoped keys at the top level, where they do not belong', () => {
		// `item_name` is only ever valid inside an items[] entry; seeing it at the top
		// level means a builder is malformed, so it is dropped as an unknown key.
		expect(findViolation('item_name', 'Villa Azul')?.kind).toBe('unknown_key');
	});

	it('rejects a key nobody declared, even if it looks harmless', () => {
		expect(findViolation('some_new_dimension', 'x')?.kind).toBe('unknown_key');
	});

	it('catches an email or phone number hiding in an allowed key', () => {
		expect(findViolation('placement', 'buyer@example.com')?.kind).toBe('email_value');
		expect(findViolation('placement', '+34 612 345 678')?.kind).toBe('phone_value');
		expect(findViolation('page_title', 'Call us on 07700 900123')?.kind).toBe('phone_value');
	});

	it('does not mistake a price band for a phone number', () => {
		// A synthesised range is a long digit run, so a naive phone heuristic strips it
		// and the price_band dimension silently disappears from GA4.
		expect(findViolation('price_band', '500000-1000000')).toBeNull();
		expect(findViolation('price_band', '1000000-5000000')).toBeNull();
		expect(findViolation('price_band', 'up-to-500000')).toBeNull();
	});

	it('catches free prose in a dimension', () => {
		expect(findViolation('placement', 'x'.repeat(121))?.kind).toBe('freetext_value');
	});

	it('exempts titles and URLs from the length ceiling', () => {
		expect(findViolation('page_title', 'A very long editorial title '.repeat(10))).toBeNull();
		expect(findViolation('page_location', `https://example.com/${'a'.repeat(200)}`)).toBeNull();
	});
});

describe('sanitizeEvent', () => {
	it('passes a clean event through unchanged', () => {
		const { event, violations } = sanitizeEvent(pageView());
		expect(violations).toEqual([]);
		expect(event).toEqual({
			event: 'ghi_virtual_page_view',
			page_path: '/spain/marbella',
			page_type: 'location'
		});
	});

	it('drops an unrecognised event entirely', () => {
		const { event } = sanitizeEvent({ event: 'ghi_something_invented' } as unknown as DataLayerEvent);
		expect(event).toBeNull();
	});

	it('drops an event with no name', () => {
		expect(sanitizeEvent({} as DataLayerEvent).event).toBeNull();
	});

	it('strips a PII key but keeps the rest of the event', () => {
		const { event, violations } = sanitizeEvent(pageView({ email: 'buyer@example.com' }));
		expect(event).not.toHaveProperty('email');
		expect(event?.page_path).toBe('/spain/marbella');
		expect(violations).toHaveLength(1);
	});

	it('drops a string-array dimension containing contact details', () => {
		const email = sanitizeEvent(
			pageView({ selected_features: ['private-pool', 'buyer@example.com'] })
		);
		expect(email.event).not.toHaveProperty('selected_features');
		expect(email.violations).toEqual([
			{ key: 'selected_features', kind: 'email_value' }
		]);

		const phone = sanitizeEvent(
			pageView({ selected_features: ['sea-view', '+34 612 345 678'] })
		);
		expect(phone.event).not.toHaveProperty('selected_features');
		expect(phone.violations).toEqual([
			{ key: 'selected_features', kind: 'phone_value' }
		]);
	});

	it('keeps a clean string-array dimension', () => {
		const { event, violations } = sanitizeEvent(
			pageView({ selected_features: ['private-pool', 'sea-view'] })
		);
		expect(event?.selected_features).toEqual(['private-pool', 'sea-view']);
		expect(violations).toEqual([]);
	});

	it('removes empty values so GTM never sees a blank dimension', () => {
		const { event } = sanitizeEvent(
			pageView({ country: undefined, community: null, sort: '', selected_features: [] })
		);
		expect(event).not.toHaveProperty('country');
		expect(event).not.toHaveProperty('community');
		expect(event).not.toHaveProperty('sort');
		expect(event).not.toHaveProperty('selected_features');
	});

	it('keeps a zero, which is a real value rather than an absent one', () => {
		const { event } = sanitizeEvent(pageView({ min_beds: 0 }));
		expect(event?.min_beds).toBe(0);
	});

	describe('items', () => {
		it('filters each entry to the permitted item fields', () => {
			const { event } = sanitizeEvent({
				event: 'ghi_listing_list_viewed',
				items: [
					{ item_id: 'GHI1', item_name: 'Villa', vendor_email: 'agent@example.com', price: 100 }
				]
			} as unknown as DataLayerEvent);
			expect(event?.items).toEqual([{ item_id: 'GHI1', item_name: 'Villa', price: 100 }]);
		});

		it('drops an item with no id', () => {
			const { event } = sanitizeEvent({
				event: 'ghi_listing_list_viewed',
				items: [{ item_name: 'Nameless' }, { item_id: 'GHI2' }]
			} as unknown as DataLayerEvent);
			expect(event?.items).toEqual([{ item_id: 'GHI2' }]);
		});

		it('strips contact details that reached an item name', () => {
			const { event } = sanitizeEvent({
				event: 'ghi_listing_viewed',
				items: [{ item_id: 'GHI1', item_name: 'Ask agent@example.com' }]
			} as unknown as DataLayerEvent);
			expect(event?.items).toEqual([{ item_id: 'GHI1' }]);
		});

		it('omits the items key when nothing survives', () => {
			const { event } = sanitizeEvent({
				event: 'ghi_listing_list_viewed',
				items: []
			} as unknown as DataLayerEvent);
			expect(event).not.toHaveProperty('items');
		});
	});
});

describe('data layer access', () => {
	it('is confined to the analytics module', () => {
		// Components must go through the typed helpers in `events.ts`, so that every
		// payload passes the sanitizer above. Enforced mechanically rather than by
		// convention, in the spirit of sanity/verification/privacy-layers.test.ts.
		const command =
			"grep -rln 'dataLayer' src --include='*.svelte' --include='*.ts' " +
			"| grep -v '^src/lib/analytics/' || true";
		const offenders = execSync(command, { cwd: process.cwd(), encoding: 'utf8' }).trim();
		expect(offenders, `dataLayer accessed outside src/lib/analytics:\n${offenders}`).toBe('');
	});
});
