import { beforeEach, describe, expect, it, vi } from 'vitest';

// `push` no-ops during SSR, and these tests exercise the browser path.
vi.mock('$app/environment', () => ({ browser: true }));

const { configureAnalytics, resetSession } = await import('./dataLayer');
const {
	priceBandLabel,
	trackContactClicked,
	trackFloorplanRequestStarted,
	trackGalleryImageViewed,
	trackGalleryOpened,
	trackLeadSubmitted,
	trackListViewed,
	trackListingSelected,
	trackListingViewed,
	trackSearchSubmitted
} = await import('./events');

type Pushed = Record<string, unknown>;

function layer(): Pushed[] {
	return (globalThis as { window?: { dataLayer?: Pushed[] } }).window?.dataLayer ?? [];
}

function last(): Pushed {
	const all = layer();
	return all[all.length - 1];
}

beforeEach(() => {
	(globalThis as { window?: unknown }).window = { dataLayer: [] };
	configureAnalytics('live');
	resetSession();
});

describe('trackSearchSubmitted', () => {
	it('emits the applied filters', () => {
		trackSearchSubmitted({
			placement: 'results_filters',
			country: 'spain',
			location: 'marbella',
			propertyType: 'villa',
			priceBand: '500000-1000000',
			minBeds: 3,
			sort: 'newest',
			selectedFeatures: ['sea-view', 'pool'],
			resultCount: 42
		});

		expect(last()).toMatchObject({
			event: 'ghi_search_submitted',
			search_placement: 'results_filters',
			country: 'spain',
			property_type: 'villa',
			price_band: '500000-1000000',
			min_beds: 3,
			result_count: 42,
			selected_features: ['sea-view', 'pool']
		});
	});

	it('never sends a search term, because the site has no free-text search', () => {
		trackSearchSubmitted({ placement: 'discovery_bar', country: 'portugal' });
		expect(last()).not.toHaveProperty('search_term');
	});

	it('omits filters that were not applied', () => {
		trackSearchSubmitted({ placement: 'discovery_bar', country: 'spain' });
		const event = last();
		expect(event).not.toHaveProperty('property_type');
		expect(event).not.toHaveProperty('selected_features');
		expect(event).not.toHaveProperty('result_count');
	});

	it('reports a zero result count, which is a meaningful outcome', () => {
		trackSearchSubmitted({ placement: 'results_filters', resultCount: 0 });
		expect(last().result_count).toBe(0);
	});

	it('caps the feature list so payloads stay bounded', () => {
		trackSearchSubmitted({
			placement: 'results_filters',
			selectedFeatures: Array.from({ length: 25 }, (_, i) => `feature-${i}`)
		});
		expect((last().selected_features as string[]).length).toBe(10);
	});
});

describe('listing events', () => {
	const item = { item_id: 'GHI00123', item_category: 'property' as const };
	const list = { list_id: 'featured', list_name: 'Featured listings' };

	it('emits a list view with its items', () => {
		trackListViewed(list, [item]);
		expect(last()).toMatchObject({
			event: 'ghi_listing_list_viewed',
			item_list_id: 'featured',
			item_list_name: 'Featured listings',
			items: [{ item_id: 'GHI00123' }]
		});
	});

	it('says nothing about an empty list', () => {
		trackListViewed(list, []);
		expect(layer()).toHaveLength(0);
	});

	it('emits a selection', () => {
		trackListingSelected({ ...item, item_list_id: 'featured', index: 2 });
		expect(last()).toMatchObject({ event: 'ghi_listing_selected', item_list_id: 'featured' });
	});

	it('emits a listing view with its kind', () => {
		trackListingViewed(item, 'unit');
		expect(last()).toMatchObject({
			event: 'ghi_listing_viewed',
			listing_id: 'GHI00123',
			listing_kind: 'unit'
		});
	});

	it('stays silent for a listing that could not be identified', () => {
		trackListingSelected(null);
		trackListingViewed(null);
		expect(layer()).toHaveLength(0);
	});
});

describe('engagement events', () => {
	it('emits a gallery open', () => {
		trackGalleryOpened({ listingId: 'GHI1', position: 0, total: 12, surface: 'property' });
		expect(last()).toMatchObject({
			event: 'ghi_gallery_opened',
			listing_id: 'GHI1',
			image_position: 0,
			image_count: 12,
			gallery_surface: 'property'
		});
	});

	it('emits image navigation with its method', () => {
		trackGalleryImageViewed({
			listingId: 'GHI1',
			position: 3,
			total: 12,
			surface: 'property',
			method: 'swipe'
		});
		expect(last()).toMatchObject({
			event: 'ghi_gallery_image_viewed',
			navigation_method: 'swipe',
			image_position: 3
		});
	});

	it('emits a floorplan request start', () => {
		trackFloorplanRequestStarted('GHI1');
		expect(last()).toMatchObject({ event: 'ghi_floorplan_request_started', listing_id: 'GHI1' });
	});

	it('emits a contact click with its placement', () => {
		trackContactClicked({ method: 'whatsapp', placement: 'listing_rail', listingId: 'GHI1' });
		expect(last()).toMatchObject({
			event: 'ghi_contact_clicked',
			contact_method: 'whatsapp',
			placement: 'listing_rail'
		});
	});
});

describe('trackLeadSubmitted', () => {
	it('emits a confirmed lead', () => {
		trackLeadSubmitted({
			leadType: 'listing_enquiry',
			formLocation: 'listing_rail',
			listingId: 'GHI00123'
		});
		expect(last()).toMatchObject({
			event: 'ghi_lead_submitted',
			lead_type: 'listing_enquiry',
			form_location: 'listing_rail',
			listing_id: 'GHI00123'
		});
	});

	it('reports the same submission only once', () => {
		// Second net behind the call site, which only fires from the enhance success branch.
		const lead = { leadType: 'listing_enquiry' as const, formLocation: 'listing_rail', listingId: 'GHI1' };
		trackLeadSubmitted(lead);
		trackLeadSubmitted(lead);
		expect(layer()).toHaveLength(1);
	});

	it('separates a floorplan request from a general enquiry on the same listing', () => {
		trackLeadSubmitted({ leadType: 'listing_enquiry', formLocation: 'listing_rail', listingId: 'GHI1' });
		trackLeadSubmitted({ leadType: 'floorplan_request', formLocation: 'listing_rail', listingId: 'GHI1' });
		expect(layer()).toHaveLength(2);
	});

	it('allows a genuine second enquiry after navigating to another page', () => {
		const lead = { leadType: 'contact_enquiry' as const, formLocation: 'contact_page' };
		trackLeadSubmitted(lead);
		resetSession();
		trackLeadSubmitted(lead);
		expect(layer()).toHaveLength(2);
	});
});

describe('priceBandLabel', () => {
	it('describes a bounded range', () => {
		expect(priceBandLabel(500_000, 1_000_000)).toBe('500000-1000000');
	});

	it('describes open-ended ranges', () => {
		expect(priceBandLabel(null, 500_000)).toBe('up-to-500000');
		expect(priceBandLabel(5_000_000, null)).toBe('5000000-plus');
	});

	it('is absent when no budget was chosen', () => {
		expect(priceBandLabel(null, null)).toBeUndefined();
		expect(priceBandLabel(undefined, undefined)).toBeUndefined();
	});

	it('survives the sanitizer, which could mistake it for a phone number', () => {
		trackSearchSubmitted({
			placement: 'discovery_bar',
			priceBand: priceBandLabel(500_000, 1_000_000)
		});
		expect(last().price_band).toBe('500000-1000000');
	});
});

describe('gating', () => {
	it('sends nothing when analytics is switched off for the environment', () => {
		configureAnalytics('off');
		trackContactClicked({ method: 'phone', placement: 'contact_page' });
		expect(layer()).toHaveLength(0);
	});
});
