import { defineQuery } from 'groq';
import { MEDIA_ASSET_PUBLIC } from '../allowlists';

/** Public gate for golf course documents. */
export const GOLF_COURSE_PUBLIC_FILTER = /* groq */ `
  (coalesce(reviewStatus, "draft") == "approved" || $previewAll)
`;

const GOLF_COURSE_PUBLIC_PROJECTION = /* groq */ `{
  _id,
  name,
  "slug": slug.current,
  shortDescription,
  tagline,
  seoTitle,
  metaDescription,
  holes,
  par,
  designStyle,
  websiteUrl,
  media[]${MEDIA_ASSET_PUBLIC},
  community->{
    _id,
    name,
    "slug": slug.current,
    breadcrumbLabel,
    "locationSlug": parent->slug.current,
    "countrySlug": parent->parent->slug.current,
    parent->{
      _id,
      name,
      "slug": slug.current,
      breadcrumbLabel
    },
    "country": parent->parent->{
      _id,
      name,
      "slug": slug.current,
      breadcrumbLabel
    }
  }
}`;

/** Single golf course page by canonical URL segments. */
export const golfCourseByPathQuery = defineQuery(`
  *[
    _type == "golfCourse"
    && slug.current == $slug
    && community->slug.current == $communitySlug
    && community->parent->slug.current == $locationSlug
    && community->parent->parent->slug.current == $countrySlug
    && ${GOLF_COURSE_PUBLIC_FILTER}
  ][0]${GOLF_COURSE_PUBLIC_PROJECTION}
`);

/** Golf courses for a location page — communities under or associated with the location. */
export const golfCoursesByLocationQuery = defineQuery(`
  *[
    _type == "golfCourse"
    && ${GOLF_COURSE_PUBLIC_FILTER}
    && defined(community._ref)
    && (
      community->parent._ref == $locationId
      || $locationId in community->associatedLocations[]._ref
    )
  ] | order(name asc)${GOLF_COURSE_PUBLIC_PROJECTION}
`);

/** Approved golf courses for sitemap path assembly. */
export const sitemapGolfCoursesQuery = defineQuery(`
  *[
    _type == "golfCourse"
    && ${GOLF_COURSE_PUBLIC_FILTER}
    && defined(slug.current)
    && defined(community->slug.current)
    && defined(community->parent->slug.current)
    && defined(community->parent->parent->slug.current)
  ]{
    "slug": slug.current,
    "communitySlug": community->slug.current,
    "locationSlug": community->parent->slug.current,
    "countrySlug": community->parent->parent->slug.current,
    _updatedAt
  }
`);
