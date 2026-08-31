/**
 * Cache-tag names, in one place so the read side (load functions tagging a rendered page)
 * and the write side (the purge webhook mapping a changed doc → tags) cannot drift.
 *
 * Two families:
 * - `doc:<_id>` — emitted automatically for every document a page renders (see
 *   tagContext.collectDocTags). Covers all *edits* to already-shown docs.
 * - structural tags — for query-based membership a `doc:` tag can't cover, i.e. a
 *   brand-new document that no stale page could have tagged (a new listing on a grid, a
 *   new frontline listing on a rail, a new insight on the hub).
 */
export const cacheTag = {
	doc: (id: string) => `doc:${id}`,
	/** Header + footer, rendered on every page (see +layout.server.ts). */
	nav: 'nav',
	/** Homepage query-driven rails (featured/frontline/partners/countries). */
	home: 'home',
	/** Country grid membership — country page and its location pages. */
	gridCountry: (countrySlug: string) => `grid:country:${countrySlug}`,
	/** Location grid membership — the location page. */
	gridLocation: (locationId: string) => `grid:loc:${locationId}`,
	/** Global "newest frontline_golf" rail (homepage, /front-line-collection). */
	frontline: 'rail:frontline',
	/** Country-scoped frontline rail (country page). */
	frontlineCountry: (countrySlug: string) => `rail:frontline:country:${countrySlug}`,
	/** Location-scoped frontline rail (location page). */
	frontlineLocation: (locationId: string) => `rail:frontline:loc:${locationId}`,
	/** Insights index (lists every insight). */
	hubInsights: 'hub:insights',
	/** Guides index (lists every guide). */
	hubGuides: 'hub:guides',
	/** Partner directory + logo walls (/partners, /contact). */
	partners: 'col:partners',
	/** A golf-course page's listing grid (listings linking that course). */
	golf: (golfCourseId: string) => `golf:${golfCourseId}`,
	/** Everything scoped to a country, e.g. listing-detail enquiry shelves by country. */
	country: (countrySlug: string) => `country:${countrySlug}`,
	/**
	 * The `/sitemap.xml` document. Its URL set and per-URL `lastmod` derive from every
	 * indexable listing, development, unit, taxonomy node, golf course, guide and insight, so
	 * a create/publish/unpublish/delete of any of those purges it (see purgeTags.ts). It is a
	 * single query-built response, so one structural tag — not per-doc tags — covers it.
	 */
	sitemap: 'sitemap'
} as const;
