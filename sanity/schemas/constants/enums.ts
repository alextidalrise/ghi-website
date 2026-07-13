/** Shared enum option lists for GHI Sanity schema objects. */

export const PRICE_QUALIFIERS = [
	{ title: 'Exact', value: 'exact' },
	{ title: 'From', value: 'from' },
	{ title: 'Guide', value: 'guide' },
	{ title: 'POA', value: 'poa' },
	{ title: 'Reduced', value: 'reduced' },
	{ title: 'Enquiry led', value: 'enquiry_led' }
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

export const PROPERTY_BUILD_STATUSES = [
	{ title: 'Built', value: 'built' },
	{ title: 'Off-Plan', value: 'off_plan' }
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

/**
 * Single source of truth for the publishable lifecycle of a gateable document
 * (propertyListing, development, unit, unitType). The public website renders
 * ONLY documents whose `status === 'published'`. There is no second visibility
 * flag — all other "is this live?" semantics collapse into this enum.
 */
export const LISTING_STATUSES = [
	{ title: 'Draft', value: 'draft' },
	{ title: 'In review', value: 'in_review' },
	{ title: 'Published', value: 'published' },
	{ title: 'Unpublished', value: 'unpublished' },
	{ title: 'Archived', value: 'archived' }
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

/**
 * Insight (editorial "Insights" / journal) categories. A single `insight` document
 * branches on this field, exactly as `guide` branches on `guideCategory`. The value
 * doubles as the article kicker and the filter chip on the /insights index. New
 * topics slot in here without a schema or route change; keep the list tight so the
 * filter bar stays scannable.
 */
export const INSIGHT_CATEGORIES = [
	{ title: 'Market & Investment', value: 'market' },
	{ title: 'Lifestyle', value: 'lifestyle' },
	{ title: 'Golf', value: 'golf' },
	{ title: 'Relocation', value: 'relocation' }
] as const;
