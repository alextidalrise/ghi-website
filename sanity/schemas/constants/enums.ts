/** Shared enum option lists for GHI Sanity schema objects. */

export const PRICE_QUALIFIERS = [
	{ title: 'Exact', value: 'exact' },
	{ title: 'From', value: 'from' },
	{ title: 'Guide', value: 'guide' },
	{ title: 'POA', value: 'poa' },
	{ title: 'Reduced', value: 'reduced' },
	{ title: 'Enquiry led', value: 'enquiry_led' }
] as const;

export const PRICE_SOURCE_STATUSES = [
	{ title: 'Source confirmed', value: 'source_confirmed' },
	{ title: 'Folder hint only', value: 'folder_hint_only' },
	{ title: 'Price list needs review', value: 'price_list_needs_review' },
	{ title: 'Manual confirmed', value: 'manual_confirmed' },
	{ title: 'Unknown', value: 'unknown' },
	{ title: 'Stale — needs review', value: 'stale_needs_review' }
] as const;

export const AVAILABILITY_STATUSES = [
	{ title: 'Available', value: 'available' },
	{ title: 'Coming soon', value: 'coming_soon' },
	{ title: 'Reserved', value: 'reserved' },
	{ title: 'Sold', value: 'sold' },
	{ title: 'Under offer', value: 'under_offer' },
	{ title: 'Unknown', value: 'unknown' },
	{ title: 'Withdrawn', value: 'withdrawn' }
] as const;

export const PUBLIC_VISIBILITY = [
	{ title: 'Visible', value: 'visible' },
	{ title: 'Hidden', value: 'hidden' },
	{ title: 'Preview only', value: 'preview_only' },
	{ title: 'Internal only', value: 'internal_only' }
] as const;

export const COMPLETION_STATUSES = [
	{ title: 'Off plan', value: 'off_plan' },
	{ title: 'Under construction', value: 'under_construction' },
	{ title: 'Near completion', value: 'near_completion' },
	{ title: 'Key ready', value: 'key_ready' },
	{ title: 'Completed', value: 'completed' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const BUILD_STATUSES = [
	{ title: 'Not started', value: 'not_started' },
	{ title: 'In progress', value: 'in_progress' },
	{ title: 'Completed', value: 'completed' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const AREA_UNITS = [
	{ title: 'Square metres', value: 'sqm' },
	{ title: 'Square feet', value: 'sqft' }
] as const;

export const POOL_TYPES = [
	{ title: 'Private', value: 'private' },
	{ title: 'Communal', value: 'communal' },
	{ title: 'None', value: 'none' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const GARDEN_TYPES = [
	{ title: 'Private', value: 'private' },
	{ title: 'Communal', value: 'communal' },
	{ title: 'None', value: 'none' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const ORIENTATIONS = [
	{ title: 'North', value: 'north' },
	{ title: 'North-east', value: 'north_east' },
	{ title: 'East', value: 'east' },
	{ title: 'South-east', value: 'south_east' },
	{ title: 'South', value: 'south' },
	{ title: 'South-west', value: 'south_west' },
	{ title: 'West', value: 'west' },
	{ title: 'North-west', value: 'north_west' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const VIEW_TYPES = [
	{ title: 'Golf', value: 'golf' },
	{ title: 'Sea', value: 'sea' },
	{ title: 'Mountain', value: 'mountain' },
	{ title: 'Countryside', value: 'countryside' },
	{ title: 'Pool', value: 'pool' },
	{ title: 'Garden', value: 'garden' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const GOLF_RELEVANCE = [
	{ title: 'Frontline golf', value: 'frontline_golf' },
	{ title: 'Golf view', value: 'golf_view' },
	{ title: 'Golf resort', value: 'golf_resort' },
	{ title: 'Near golf', value: 'near_golf' },
	{ title: 'Close to golf', value: 'close_to_golf' },
	{ title: 'Manual enrichment needed', value: 'manual_enrichment_needed' },
	{ title: 'None', value: 'none' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const GOLF_ENRICHMENT_STATUSES = [
	{ title: 'Not started', value: 'not_started' },
	{ title: 'In progress', value: 'in_progress' },
	{ title: 'Reviewed', value: 'reviewed' },
	{ title: 'Not applicable', value: 'not_applicable' }
] as const;

export const FEATURE_CATEGORIES = [
	{ title: 'Golf', value: 'golf' },
	{ title: 'Outdoor', value: 'outdoor' },
	{ title: 'Interior', value: 'interior' },
	{ title: 'Community', value: 'community' },
	{ title: 'Location', value: 'location' },
	{ title: 'Energy', value: 'energy' },
	{ title: 'Security', value: 'security' },
	{ title: 'Wellness', value: 'wellness' },
	{ title: 'Investment', value: 'investment' }
] as const;

export const ASSET_CATEGORIES = [
	{ title: 'Hero', value: 'hero' },
	{ title: 'Gallery', value: 'gallery' },
	{ title: 'Floorplan', value: 'floorplan' },
	{ title: 'Brochure', value: 'brochure' },
	{ title: 'Video', value: 'video' },
	{ title: 'Render', value: 'render' },
	{ title: 'Location', value: 'location' },
	{ title: 'Lifestyle', value: 'lifestyle' },
	{ title: 'Source document', value: 'source_document' }
] as const;

export const REVIEW_SEVERITIES = [
	{ title: 'Must check', value: 'must_check' },
	{ title: 'Nice to check', value: 'nice_to_check' },
	{ title: 'Internal note', value: 'internal_note' }
] as const;

export const REVIEW_SOURCE_LEVELS = [
	{ title: 'Window card', value: 'window_card' },
	{ title: 'Brochure', value: 'brochure' },
	{ title: 'Source folder', value: 'source_folder' },
	{ title: 'Deep audit', value: 'deep_audit' },
	{ title: 'Derived', value: 'derived' }
] as const;

export const REVIEW_CATEGORIES = [
	{ title: 'Price', value: 'price' },
	{ title: 'Facts', value: 'facts' },
	{ title: 'Media', value: 'media' },
	{ title: 'Location', value: 'location' },
	{ title: 'Copy', value: 'copy' },
	{ title: 'SEO', value: 'seo' },
	{ title: 'Legal', value: 'legal' },
	{ title: 'Internal', value: 'internal' }
] as const;

export const BROCHURE_VISIBILITY = [
	{ title: 'Disabled', value: 'disabled' },
	{ title: 'Request only', value: 'request_only' },
	{ title: 'Public approved', value: 'public_approved' },
	{ title: 'Internal source only', value: 'internal_source_only' }
] as const;

export const SIMILAR_PROPERTIES_MODES = [
	{ title: 'Automatic', value: 'automatic' },
	{ title: 'Manual', value: 'manual' },
	{ title: 'Tags', value: 'tags' },
	{ title: 'Disabled', value: 'disabled' }
] as const;

export const SCHEMA_TYPES = [
	{ title: 'Real estate listing', value: 'RealEstateListing' },
	{ title: 'Residence', value: 'Residence' },
	{ title: 'Apartment', value: 'Apartment' },
	{ title: 'House', value: 'House' },
	{ title: 'Product', value: 'Product' }
] as const;

export const CONTENT_STATUSES = [
	{ title: 'Draft', value: 'draft' },
	{ title: 'Needs facts', value: 'needs_facts' },
	{ title: 'Ready for editorial', value: 'ready_for_editorial' },
	{ title: 'Ready for GHI review', value: 'ready_for_ghi_review' },
	{ title: 'Approved', value: 'approved' },
	{ title: 'Published', value: 'published' },
	{ title: 'Archived', value: 'archived' }
] as const;

export const PUBLISH_READINESS = [
	{ title: 'Metadata only', value: 'metadata_only' },
	{ title: 'Structured extracted — needs review', value: 'structured_extracted_needs_review' },
	{ title: 'Governance hold', value: 'governance_hold' },
	{ title: 'Ready for editorial', value: 'ready_for_editorial' },
	{ title: 'Ready for GHI review', value: 'ready_for_ghi_review' },
	{ title: 'Approved for publish', value: 'approved_for_publish' },
	{ title: 'Published', value: 'published' },
	{ title: 'Archived', value: 'archived' }
] as const;

export const CHANNEL_KEYS = [
	{ title: 'Website', value: 'website' },
	{ title: 'Email', value: 'email' },
	{ title: 'Social', value: 'social' },
	{ title: 'CRM', value: 'crm' },
	{ title: 'Paid ads', value: 'paid_ads' }
] as const;

export const CHANNEL_READINESS_STATUSES = [
	{ title: 'Not ready', value: 'not_ready' },
	{ title: 'In progress', value: 'in_progress' },
	{ title: 'Ready', value: 'ready' },
	{ title: 'Blocked', value: 'blocked' }
] as const;

export const SOURCE_CONFIDENCE = [
	{ title: 'High', value: 'high' },
	{ title: 'Medium', value: 'medium' },
	{ title: 'Low', value: 'low' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const PUBLIC_SAFE_STATUSES = [
	{ title: 'Public safe', value: 'public_safe' },
	{ title: 'Needs review', value: 'needs_review' },
	{ title: 'Not public safe', value: 'not_public_safe' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const SOURCE_EXTRACTION_METHODS = [
	{ title: 'Manual entry', value: 'manual_entry' },
	{ title: 'Brochure extraction', value: 'brochure_extraction' },
	{ title: 'Price list extraction', value: 'price_list_extraction' },
	{ title: 'Agent supplied', value: 'agent_supplied' },
	{ title: 'Drive sync', value: 'drive_sync' },
	{ title: 'Drive folder inventory', value: 'drive_folder_inventory' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const SENSITIVE_REVIEW_STATUSES = [
	{ title: 'Not required', value: 'not_required' },
	{ title: 'Pending', value: 'pending' },
	{ title: 'In review', value: 'in_review' },
	{ title: 'Approved', value: 'approved' },
	{ title: 'Blocked', value: 'blocked' }
] as const;

export const SENSITIVE_ASSET_TYPES = [
	{ title: 'Legal document', value: 'legal_document' },
	{ title: 'Cadastral plan', value: 'cadastral_plan' },
	{ title: 'Collaboration contract', value: 'collaboration_contract' },
	{ title: 'Commission wording', value: 'commission_wording' },
	{ title: 'Source price list', value: 'source_price_list' },
	{ title: 'Unreviewed brochure', value: 'unreviewed_brochure' },
	{ title: 'Other', value: 'other' }
] as const;

export const COMMISSION_VISIBILITY = [
	{ title: 'Private / internal', value: 'private_internal' }
] as const;

export const FEES_TAX_VISIBILITY = [
	{ title: 'Private / internal', value: 'private_internal' }
] as const;

export const LISTING_KINDS = [
	{ title: 'Property', value: 'property' },
	{ title: 'Development', value: 'development' },
	{ title: 'Unit', value: 'unit' },
	{ title: 'Unit type', value: 'unit_type' }
] as const;

export const PROPERTY_LISTING_KINDS = [
	{ title: 'Property', value: 'property' },
	{ title: 'Unit', value: 'unit' }
] as const;

export const PROPERTY_TYPES = [
	{ title: 'Villa', value: 'villa' },
	{ title: 'Apartment', value: 'apartment' },
	{ title: 'Penthouse', value: 'penthouse' },
	{ title: 'Townhouse', value: 'townhouse' },
	{ title: 'Plot', value: 'plot' },
	{ title: 'Finca', value: 'finca' },
	{ title: 'Development', value: 'development' }
] as const;

export const TRANSACTION_TYPES = [
	{ title: 'Sale', value: 'sale' },
	{ title: 'Rent', value: 'rent' },
	{ title: 'Short term', value: 'short_term' },
	{ title: 'Other', value: 'other' }
] as const;

export const LOCATION_TAXONOMY_TYPES = [
	{ title: 'Country', value: 'country' },
	{ title: 'Location', value: 'location' },
	{ title: 'Community', value: 'community' }
] as const;

export const DEVELOPMENT_DISPLAY_MODES = [
	{ title: 'Flat listing', value: 'flat_listing' },
	{ title: 'Unit types', value: 'unit_types' },
	{ title: 'Units', value: 'units' },
	{ title: 'Price from summary', value: 'price_from_summary' },
	{ title: 'Enquiry led', value: 'enquiry_led' }
] as const;

export const DEVELOPMENT_STATUSES = [
	{ title: 'Planning', value: 'planning' },
	{ title: 'Off plan', value: 'off_plan' },
	{ title: 'Under construction', value: 'under_construction' },
	{ title: 'Near completion', value: 'near_completion' },
	{ title: 'Completed', value: 'completed' },
	{ title: 'Sold out', value: 'sold_out' },
	{ title: 'Unknown', value: 'unknown' }
] as const;

export const GOLF_COURSE_REVIEW_STATUSES = [
	{ title: 'Draft', value: 'draft' },
	{ title: 'Needs review', value: 'needs_review' },
	{ title: 'Approved', value: 'approved' },
	{ title: 'Archived', value: 'archived' }
] as const;

/**
 * Guide categories. `buying` is live; `location` and `golf` are reserved so the
 * section can expand without a schema change. A single `guide` document branches on
 * this field (mirroring how `locationTaxonomy` branches on `type`).
 */
export const GUIDE_CATEGORIES = [
	{ title: 'Buying guide', value: 'buying' },
	{ title: 'Location guide', value: 'location' },
	{ title: 'Golf guide', value: 'golf' }
] as const;

/** Tone of an editorial callout inside a guide section body. */
export const GUIDE_CALLOUT_TONES = [
	{ title: 'Note', value: 'note' },
	{ title: 'Important', value: 'important' }
] as const;
