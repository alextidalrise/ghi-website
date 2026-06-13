import { defineQuery } from 'groq';
import { GUIDE_CARD_PUBLIC, GUIDE_DETAIL_FIELDS } from '../allowlists';

/**
 * A single guide by slug, plus its related guides (other published guides in the
 * same category, self excluded). Cross-linking stays scoped to the category so a
 * buying guide never points at a location guide.
 */
export const guideBySlugQuery = defineQuery(`
  *[_type == "guide" && slug.current == $slug][0]{
    ${GUIDE_DETAIL_FIELDS},
    "relatedGuides": *[
      _type == "guide"
      && guideCategory == ^.guideCategory
      && defined(slug.current)
      && slug.current != ^.slug.current
    ] | order(coalesce(order, 999) asc, title asc) ${GUIDE_CARD_PUBLIC}
  }
`);

/** All guides for the hub, ordered for grouping by category on the page. */
export const guidesHubQuery = defineQuery(`
  *[_type == "guide" && defined(slug.current)]
    | order(coalesce(order, 999) asc, title asc) ${GUIDE_CARD_PUBLIC}
`);

/** Indexable guide slugs for the sitemap. */
export const sitemapGuidesQuery = defineQuery(`
  *[
    _type == "guide"
    && defined(slug.current)
    && coalesce(seo.noindex, false) != true
  ]{
    "slug": slug.current,
    _updatedAt
  }
`);
