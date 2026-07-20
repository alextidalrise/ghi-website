/**
 * Shared analytics types.
 *
 * Deliberately vendor-neutral: nothing here names GA4 fields that GTM could map
 * itself. Components emit GHI-shaped events (`ghi_*`); the GTM container decides
 * how they become GA4 events. Renaming a GA4 event should never require a code
 * change here.
 */

/** Consent categories the visitor can control. `necessary` is implied and never stored. */
export type ConsentCategories = {
	analytics: boolean;
	marketing: boolean;
};

/**
 * What we persist in the `ghi_consent` cookie. Strictly non-identifying: two
 * booleans, a schema version and the moment of the decision. Never extend this
 * with anything that could single out a visitor.
 */
export type StoredConsent = ConsentCategories & {
	version: number;
	/** ISO-8601 timestamp of the decision, for audit and expiry reasoning. */
	timestamp: string;
};

/** Google Consent Mode signal names we manage. */
export type ConsentSignal =
	| 'ad_storage'
	| 'ad_user_data'
	| 'ad_personalization'
	| 'analytics_storage'
	| 'personalization_storage'
	| 'security_storage';

export type ConsentSignalState = 'granted' | 'denied';

export type ConsentSignals = Record<ConsentSignal, ConsentSignalState>;

/** Every data-layer event name the application may emit. */
export type GhiEventName =
	| 'ghi_virtual_page_view'
	| 'ghi_search_submitted'
	| 'ghi_listing_list_viewed'
	| 'ghi_listing_selected'
	| 'ghi_listing_viewed'
	| 'ghi_gallery_opened'
	| 'ghi_gallery_image_viewed'
	| 'ghi_floorplan_request_started'
	| 'ghi_contact_clicked'
	| 'ghi_lead_submitted';

/** Kind of listing an event refers to. Mirrors the domain's `listingKind`. */
export type ListingKind = 'property' | 'development' | 'unit';

/** Where a lead came from. Only types that genuinely reach HubSpot belong here. */
export type LeadType = 'listing_enquiry' | 'contact_enquiry' | 'floorplan_request';

/** How a visitor chose to make contact outside a form. */
export type ContactMethod = 'whatsapp' | 'phone' | 'email';

/**
 * A GA4 `items` entry. Only non-identifying listing metadata — never an address,
 * never a vendor reference, never a Sanity document id.
 */
export type AnalyticsItem = {
	item_id: string;
	item_name?: string;
	item_brand?: string;
	item_category?: ListingKind;
	item_category2?: string;
	item_category3?: string;
	item_category4?: string;
	price?: number;
	currency?: string;
	item_list_id?: string;
	item_list_name?: string;
	index?: number;
};

/** A named collection a listing was shown in (rail, grid, results page). */
export type ListContext = {
	list_id: string;
	list_name: string;
};

/** Values a data-layer payload may carry. Objects are limited to item arrays. */
export type DataLayerValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| string[]
	| AnalyticsItem[];

export type DataLayerPayload = Record<string, DataLayerValue>;

export type DataLayerEvent = DataLayerPayload & { event: GhiEventName };

declare global {
	interface Window {
		dataLayer?: unknown[];
		/** Set by the GTM bootstrap; typed loosely because gtag is variadic. */
		gtag?: (...args: unknown[]) => void;
	}
}
