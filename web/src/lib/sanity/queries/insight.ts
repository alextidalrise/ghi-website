import { defineQuery } from 'groq';
import { INSIGHT_CARD_PUBLIC, INSIGHT_DETAIL_FIELDS } from '../allowlists';

/**
 * A single article by slug, plus its related reading. Related uses the editor's manual
 * picks when set, otherwise the newest other articles in the same category (self
 * excluded) — the "auto + optional override" model.
 */
export const insightBySlugQuery = defineQuery(`
  *[_type == "insight" && slug.current == $slug][0]{
    ${INSIGHT_DETAIL_FIELDS},
    "related": select(
      count(relatedInsights) > 0 =>
        relatedInsights[defined(@->slug.current)]->${INSIGHT_CARD_PUBLIC},
      *[
        _type == "insight"
        && insightCategory == ^.insightCategory
        && defined(slug.current)
        && defined(publishedAt)
        && slug.current != ^.slug.current
      ] | order(publishedAt desc)[0...3] ${INSIGHT_CARD_PUBLIC}
    )
  }
`);

/**
 * Every published insight for the /insights index, newest first. The index fetches
 * the full set once (card projections are tiny — no body), then derives the filter
 * counts, the featured lead, and each page of the grid in memory. Reverse-chronology
 * is the section's spine, so `publishedAt desc` is the single ordering.
 */
export const insightsHubQuery = defineQuery(`
  *[_type == "insight" && defined(slug.current) && defined(publishedAt)]
    | order(publishedAt desc) ${INSIGHT_CARD_PUBLIC}
`);

/** Indexable insight slugs for the sitemap. */
export const sitemapInsightsQuery = defineQuery(`
  *[
    _type == "insight"
    && defined(slug.current)
    && defined(publishedAt)
    && coalesce(seo.noindex, false) != true
  ]{
    "slug": slug.current,
    _updatedAt
  }
`);
