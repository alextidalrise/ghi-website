import { cacheTag } from './tags';

/**
 * The Sanity-webhook payload the purge endpoint consumes. The webhook's GROQ projection
 * (documented in docs/edge-caching-plan.md and routes/api/cache-purge) computes these
 * structural fields so this stays a pure function with no Sanity round-trip — which also
 * means it works for delete events, where the document can no longer be queried back.
 *
 * Every field beyond `_id`/`_type` is optional: it is null for doc types that don't carry
 * it, and a missing field simply contributes no structural tag.
 */
export interface PurgePayload {
	_id: string;
	_type: string;
	/** Country slug from the listing/dev location chain, or a guide's `country` enum. */
	countrySlug?: string | null;
	/** Primary location taxonomy `_id` (from the listing/dev/community/location chain). */
	locationId?: string | null;
	/** For unit/unitType: the parent development `_ref`. */
	parentDevelopmentId?: string | null;
	/** True when this (or its parent development) is a frontline_golf listing. */
	isFrontline?: boolean | null;
	/** Golf course `_ref`s a listing/dev links (its markers + the courses' grid pages). */
	golfCourseIds?: (string | null)[] | null;
	/** locationTaxonomy discriminator: 'country' | 'location' | 'community'. */
	taxonomyType?: string | null;
	/** For a community taxonomy node: its parent location `_id`. */
	parentLocationId?: string | null;
	/** partner.countries — the country slugs whose listing enquiry shelves show this partner. */
	partnerCountrySlugs?: (string | null)[] | null;
}

/**
 * Map a changed document to the exact cache tags to invalidate.
 *
 * `doc:<_id>` is always included: it purges every page that *rendered* the document (detail
 * page, cards, embedded rails, bylines) — the render-time dependency captured by
 * `tagContext.collectDocTags`. The structural tags added per type cover the "new document"
 * case, where a not-yet-existing doc could not have been tagged on any stale page.
 */
export function tagsForDoc(payload: PurgePayload): string[] {
	const tags = new Set<string>();
	const add = (tag: string | null | undefined | false) => {
		if (tag) tags.add(tag);
	};

	add(cacheTag.doc(payload._id));

	const {
		_type,
		countrySlug,
		locationId,
		parentDevelopmentId,
		isFrontline,
		golfCourseIds,
		taxonomyType,
		parentLocationId,
		partnerCountrySlugs
	} = payload;

	const addFrontline = () => {
		if (!isFrontline) return;
		add(cacheTag.frontline);
		add(countrySlug && cacheTag.frontlineCountry(countrySlug));
		add(locationId && cacheTag.frontlineLocation(locationId));
	};

	switch (_type) {
		case 'propertyListing':
		case 'development': {
			add(locationId && cacheTag.gridLocation(locationId));
			add(countrySlug && cacheTag.gridCountry(countrySlug));
			addFrontline();
			for (const id of golfCourseIds ?? []) add(id && cacheTag.golf(id));
			// Listing/development URLs are sitemap members; publish/unpublish/delete shifts the set.
			add(cacheTag.sitemap);
			break;
		}
		case 'unit':
		case 'unitType': {
			// The parent development's page renders this child inline, and its grid/rail cards
			// aggregate child counts — refresh both via the parent's doc tag and grids.
			add(parentDevelopmentId && cacheTag.doc(parentDevelopmentId));
			add(locationId && cacheTag.gridLocation(locationId));
			add(countrySlug && cacheTag.gridCountry(countrySlug));
			addFrontline();
			// A unit is its own sitemap URL; a unit type is not (it has no page of its own).
			add(_type === 'unit' && cacheTag.sitemap);
			break;
		}
		case 'locationTaxonomy': {
			add(cacheTag.nav);
			// Country/location nodes are sitemap URLs, and any node's slug or isCatchAll feeds the
			// listing/unit path segments the sitemap emits — so every taxonomy change purges it.
			add(cacheTag.sitemap);
			if (taxonomyType === 'country') {
				add(countrySlug && cacheTag.gridCountry(countrySlug));
				add(cacheTag.home);
			} else if (taxonomyType === 'location') {
				add(cacheTag.gridLocation(payload._id));
				add(countrySlug && cacheTag.gridCountry(countrySlug));
			} else if (taxonomyType === 'community') {
				add(parentLocationId && cacheTag.gridLocation(parentLocationId));
			}
			break;
		}
		case 'insight':
		case 'author': {
			// author bylines render on insight pages/cards; the hub relists them.
			add(cacheTag.hubInsights);
			// An insight is a sitemap URL; an author is not.
			add(_type === 'insight' && cacheTag.sitemap);
			break;
		}
		case 'guide': {
			add(cacheTag.hubGuides);
			add(countrySlug && cacheTag.country(countrySlug));
			// Guide detail pages are sitemap URLs.
			add(cacheTag.sitemap);
			break;
		}
		case 'golfCourse': {
			// A golf course's own page carries its `doc:` tag already; the sitemap lists its URL,
			// so a create/publish/delete must also purge the sitemap.
			add(cacheTag.sitemap);
			break;
		}
		case 'partner': {
			add(cacheTag.partners);
			add(cacheTag.home);
			for (const slug of partnerCountrySlugs ?? []) add(slug && cacheTag.country(slug));
			break;
		}
		case 'partnerCategory': {
			add(cacheTag.partners);
			break;
		}
		case 'siteSettings': {
			// Hero, featured rails, and feature-filter settings touch the homepage and every grid.
			add(cacheTag.home);
			add(cacheTag.nav);
			break;
		}
		// aboutPage / contactPage / guidesHubPage: single pages covered by their `doc:` tag.
	}

	return [...tags];
}
