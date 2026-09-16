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

/**
 * Every guide, shaped for the hub's two-question finder: who it is for, where, and what
 * it covers. Chapter headings are the proof the answer panel shows, so they ride along;
 * the section bodies do not.
 *
 * `coalesce(country->slug.current, country)` reads the market in either stored shape.
 */
export const guidesHubQuery = defineQuery(`
  *[_type == "guide" && defined(slug.current)]
    | order(coalesce(order, 999) asc, title asc){
      "slug": slug.current,
      title,
      tagline,
      guideCategory,
      lastReviewed,
      "chapters": sections[defined(heading)].heading,
      "audience": audience->slug.current,
      "market": coalesce(country->slug.current, country)
    }
`);

/** The answers to "Who are you buying as?", in editor order. */
export const buyerTypesQuery = defineQuery(`
  *[_type == "buyerType" && defined(slug.current)]
    | order(coalesce(order, 999) asc, name asc){
      name,
      "slug": slug.current
    }
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
