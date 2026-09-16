import { defineQuery } from 'groq';
import { fetchPublic } from './fetch';
import type { Market, MarketWithCount } from '$lib/markets/markets';

/**
 * The site's one canonical market ordering, as a GROQ fragment.
 *
 * `displayOrder` on the country document is the editor's control; a country without one
 * falls to the end alphabetically rather than jumping to the front, so a market added in
 * Studio before anyone sets its order lands somewhere sensible instead of displacing
 * Spain. Every query that lists markets appends this, so they can never disagree.
 */
export const MARKET_ORDERING = /* groq */ `order(coalesce(displayOrder, 9999) asc, name asc)`;

/** Fields every market surface needs: the name, the route, and the flag stamp. */
export const MARKET_PUBLIC = /* groq */ `{
  name,
  "slug": slug.current,
  "flagUrl": flag.asset->url
}`;

/** Every market, in canonical order. */
export const marketsQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && defined(slug.current)
  ] | ${MARKET_ORDERING} ${MARKET_PUBLIC}
`);

/**
 * Markets with the number of partners covering each, for the /partners coverage filter.
 *
 * The count is the honesty device on that page: a market with two vetted firms says two,
 * rather than letting the buyer discover it by filtering. Counted across the whole
 * partner set — the same `references` test the directory itself uses — and it tolerates
 * the legacy string shape so the page reads correctly either side of the country-refs
 * migration.
 */
export const marketsWithPartnerCountsQuery = defineQuery(`
  *[
    _type == "locationTaxonomy"
    && type == "country"
    && defined(slug.current)
  ] | ${MARKET_ORDERING} {
    name,
    "slug": slug.current,
    "flagUrl": flag.asset->url,
    "count": count(*[
      _type == "partner"
      && defined(slug.current)
      && (references(^._id) || ^.slug.current in countries)
    ])
  }
`);

/** Every market, in canonical order. Empty on failure — a market list is never load-bearing. */
export async function fetchMarkets(): Promise<Market[]> {
	const raw = await fetchPublic<Array<Partial<Market>>>(marketsQuery);
	return toMarkets(raw);
}

/** Markets carrying their partner counts, for the coverage filter. */
export async function fetchMarketsWithPartnerCounts(): Promise<MarketWithCount[]> {
	const raw = await fetchPublic<Array<Partial<Market> & { count?: number | null }>>(
		marketsWithPartnerCountsQuery
	);
	// Mapped in one pass rather than zipping against `toMarkets`: that filters rows, so
	// the two lists would fall out of step the first time a country lacked a slug.
	return (raw ?? [])
		.filter(
			(entry): entry is Partial<Market> & { slug: string; name: string; count?: number | null } =>
				Boolean(entry?.slug && entry?.name)
		)
		.map((entry) => ({
			slug: entry.slug,
			name: entry.name,
			flagUrl: entry.flagUrl ?? null,
			count: entry.count ?? 0
		}));
}

/** Drop anything without the two fields every market surface needs to render a row. */
function toMarkets(raw: Array<Partial<Market>> | null | undefined): Market[] {
	return (raw ?? [])
		.filter((entry): entry is Market => Boolean(entry?.slug && entry?.name))
		.map((entry) => ({
			slug: entry.slug,
			name: entry.name,
			flagUrl: entry.flagUrl ?? null
		}));
}
