import { defineQuery } from 'groq';
import { GUIDE_CARD_PUBLIC, GUIDE_DETAIL_FIELDS } from '../allowlists';

/**
 * A single guide by slug, plus its related guides (other published guides in the
 * same category, self excluded). Cross-linking stays scoped to the category so a
 * buying guide never points at a location guide.
 *
 * Same-market guides lead. With two markets and four guides, ordering by `order` alone
 * happened to keep a Spain guide next to its sibling; at four markets it puts the
 * Montenegro guide under the Spain one, which is a worse suggestion than showing nothing.
 * Built as two ordered lists concatenated rather than one clever sort, because `^` inside
 * an `order()` on a nested subquery is exactly the kind of scoping that breaks quietly.
 *
 * `coalesce(country->slug.current, country)` reads either shape, so the split is correct
 * before and after the country-refs migration.
 */
export const guideBySlugQuery = defineQuery(`
  *[_type == "guide" && slug.current == $slug][0]{
    ${GUIDE_DETAIL_FIELDS},
    "relatedGuides": [
      ...*[
        _type == "guide"
        && guideCategory == ^.guideCategory
        && defined(slug.current)
        && slug.current != ^.slug.current
        && coalesce(country->slug.current, country) == coalesce(^.country->slug.current, ^.country)
      ] | order(coalesce(order, 999) asc, title asc) ${GUIDE_CARD_PUBLIC},
      ...*[
        _type == "guide"
        && guideCategory == ^.guideCategory
        && defined(slug.current)
        && slug.current != ^.slug.current
        && coalesce(country->slug.current, country) != coalesce(^.country->slug.current, ^.country)
      ] | order(coalesce(order, 999) asc, title asc) ${GUIDE_CARD_PUBLIC}
    ]
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
