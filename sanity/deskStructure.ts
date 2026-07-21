import {
	BookIcon,
	CheckmarkIcon,
	ClipboardIcon,
	ComposeIcon,
	DesktopIcon,
	DocumentIcon,
	EarthAmericasIcon,
	EditIcon,
	EnvelopeIcon,
	EyeClosedIcon,
	InfoOutlineIcon,
	UsersIcon,
	WarningOutlineIcon
} from '@sanity/icons';
import type { StructureResolver } from 'sanity/structure';
import { INSIGHT_CATEGORIES } from './schemas/constants/enums';

/**
 * Status-driven desk views. Each lifecycle stage gets its own list so the
 * desk maps 1:1 to how listings move through intake → review → live → off.
 * "Published but blocked" is a safety-net view that should normally be empty:
 * if anything appears there, a published listing has an unresolved blocking
 * review item and a human should resolve it or move the listing back to
 * in_review.
 */
const DRAFTS_PREDICATE = 'coalesce(status, "draft") == "draft"';
const IN_REVIEW_PREDICATE = 'coalesce(status, "draft") == "in_review"';
const PUBLISHED_PREDICATE = 'coalesce(status, "draft") == "published"';
const UNPUBLISHED_PREDICATE = 'coalesce(status, "draft") in ["unpublished", "archived"]';
const PUBLISHED_BUT_BLOCKED_PREDICATE = `${PUBLISHED_PREDICATE} && count(reviewItems[blocksPublish == true]) > 0`;

const GATEABLE_TYPES = ['propertyListing', 'development', 'unit', 'unitType'] as const;
const GATEABLE_TYPES_GROQ = `[${GATEABLE_TYPES.map((t) => `"${t}"`).join(', ')}]`;

const filterFor = (predicate: string) =>
	`_type in ${GATEABLE_TYPES_GROQ} && (${predicate})`;

export const deskStructure: StructureResolver = (S) =>
	S.list()
		.title('Content')
		.items([
			S.listItem()
				.title('Site settings')
				.icon(DesktopIcon)
				.child(
					S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')
				),
			S.listItem()
				.title('Pages')
				.icon(ComposeIcon)
				.child(
					S.list()
						.title('Pages')
						.items([
							S.listItem()
								.title('Guides hub')
								.icon(BookIcon)
								.child(
									S.document()
										.schemaType('guidesHubPage')
										.documentId('guidesHubPage')
										.title('Guides hub')
								),
							S.listItem()
								.title('About')
								.icon(InfoOutlineIcon)
								.child(
									S.document()
										.schemaType('aboutPage')
										.documentId('aboutPage')
										.title('About')
								),
							S.listItem()
								.title('Contact')
								.icon(EnvelopeIcon)
								.child(
									S.document()
										.schemaType('contactPage')
										.documentId('contactPage')
										.title('Contact')
								)
						])
				),
			S.listItem()
				.title('Properties')
				.schemaType('propertyListing')
				.child(S.documentTypeList('propertyListing').title('Properties')),
			S.listItem()
				.title('Developments')
				.schemaType('development')
				.child(S.documentTypeList('development').title('Developments')),
			S.listItem()
				.title('Units')
				.child(
					S.list()
						.title('Units')
						.items([
							S.listItem()
								.title('Units')
								.schemaType('unit')
								.child(S.documentTypeList('unit').title('Units')),
							S.listItem()
								.title('Unit types')
								.schemaType('unitType')
								.child(S.documentTypeList('unitType').title('Unit types'))
						])
				),
			S.listItem()
				.title('Places')
				.icon(EarthAmericasIcon)
				.child(
					S.list()
						.title('Places')
						.items([
							S.listItem()
								.title('Countries')
								.id('location-taxonomy-countries')
								.schemaType('locationTaxonomy')
								.child(
									S.documentList()
										.id('location-taxonomy-countries-list')
										.title('Countries')
										.schemaType('locationTaxonomy')
										.apiVersion('2025-01-01')
										.filter('_type == $schemaType && type == $taxonomyType')
										.params({ schemaType: 'locationTaxonomy', taxonomyType: 'country' })
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								),
							S.listItem()
								.title('Locations')
								.id('location-taxonomy-locations')
								.schemaType('locationTaxonomy')
								.child(
									S.documentList()
										.id('location-taxonomy-locations-list')
										.title('Locations')
										.schemaType('locationTaxonomy')
										.apiVersion('2025-01-01')
										.filter('_type == $schemaType && type == $taxonomyType')
										.params({ schemaType: 'locationTaxonomy', taxonomyType: 'location' })
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								),
							S.listItem()
								.title('Communities')
								.id('location-taxonomy-communities')
								.schemaType('locationTaxonomy')
								.child(
									S.documentList()
										.id('location-taxonomy-communities-list')
										.title('Communities')
										.schemaType('locationTaxonomy')
										.apiVersion('2025-01-01')
										.filter('_type == $schemaType && type == $taxonomyType')
										.params({ schemaType: 'locationTaxonomy', taxonomyType: 'community' })
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								)
						])
				),
			S.listItem()
				.title('Golf courses')
				.schemaType('golfCourse')
				.child(S.documentTypeList('golfCourse').title('Golf courses')),
			S.listItem()
				.title('Guides')
				.icon(BookIcon)
				.child(
					S.list()
						.title('Guides')
						.items([
							S.listItem()
								.title('Buying guides')
								.id('guides-buying')
								.schemaType('guide')
								.child(
									S.documentList()
										.id('guides-buying-list')
										.title('Buying guides')
										.schemaType('guide')
										.apiVersion('2025-01-01')
										.filter('_type == $schemaType && guideCategory == $category')
										.params({ schemaType: 'guide', category: 'buying' })
										.defaultOrdering([{ field: 'order', direction: 'asc' }])
										.initialValueTemplates([])
								),
							S.listItem()
								.title('Location guides')
								.id('guides-location')
								.schemaType('guide')
								.child(
									S.documentList()
										.id('guides-location-list')
										.title('Location guides')
										.schemaType('guide')
										.apiVersion('2025-01-01')
										.filter('_type == $schemaType && guideCategory == $category')
										.params({ schemaType: 'guide', category: 'location' })
										.defaultOrdering([{ field: 'order', direction: 'asc' }])
										.initialValueTemplates([])
								),
							S.listItem()
								.title('Golf guides')
								.id('guides-golf')
								.schemaType('guide')
								.child(
									S.documentList()
										.id('guides-golf-list')
										.title('Golf guides')
										.schemaType('guide')
										.apiVersion('2025-01-01')
										.filter('_type == $schemaType && guideCategory == $category')
										.params({ schemaType: 'guide', category: 'golf' })
										.defaultOrdering([{ field: 'order', direction: 'asc' }])
										.initialValueTemplates([])
								),
							S.divider(),
							S.listItem()
								.title('All guides')
								.id('guides-all')
								.schemaType('guide')
								.child(S.documentTypeList('guide').title('All guides'))
						])
				),
			S.listItem()
				.title('Insights')
				.icon(EditIcon)
				.child(
					S.list()
						.title('Insights')
						.items([
							...INSIGHT_CATEGORIES.map((category) =>
								S.listItem()
									.title(category.title)
									.id(`insights-${category.value}`)
									.schemaType('insight')
									.child(
										S.documentList()
											.id(`insights-${category.value}-list`)
											.title(category.title)
											.schemaType('insight')
											.apiVersion('2025-01-01')
											.filter('_type == $schemaType && insightCategory == $category')
											.params({ schemaType: 'insight', category: category.value })
											.defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
											.initialValueTemplates([])
									)
							),
							S.divider(),
							S.listItem()
								.title('All insights')
								.id('insights-all')
								.schemaType('insight')
								.child(
									S.documentTypeList('insight')
										.title('All insights')
										.defaultOrdering([{ field: 'publishedAt', direction: 'desc' }])
								),
							S.listItem()
								.title('Authors')
								.id('insights-authors')
								.icon(UsersIcon)
								.schemaType('author')
								.child(
									S.documentTypeList('author')
										.title('Authors')
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								)
						])
				),
			S.listItem()
				.title('Partners')
				.icon(UsersIcon)
				.child(
					S.list()
						.title('Partners')
						.items([
							S.listItem()
								.title('Partners')
								.id('partners-list')
								.schemaType('partner')
								.child(
									S.documentTypeList('partner')
										.title('Partners')
										.defaultOrdering([{ field: 'order', direction: 'asc' }])
								),
							S.listItem()
								.title('Categories')
								.id('partner-categories-list')
								.schemaType('partnerCategory')
								.child(
									S.documentTypeList('partnerCategory')
										.title('Categories')
										.defaultOrdering([{ field: 'order', direction: 'asc' }])
								)
						])
				),
			S.divider(),
			S.listItem()
				.title('Listings status')
				.icon(ClipboardIcon)
				.child(
					S.list()
						.title('Listings status')
						.items([
							S.listItem()
								.title('Drafts')
								.icon(DocumentIcon)
								.child(
									S.documentList()
										.title('Drafts')
										.schemaType('propertyListing')
										.filter(filterFor(DRAFTS_PREDICATE))
										.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
								),
							S.listItem()
								.title('In review')
								.icon(EditIcon)
								.child(
									S.documentList()
										.title('In review')
										.schemaType('propertyListing')
										.filter(filterFor(IN_REVIEW_PREDICATE))
										.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
								),
							S.listItem()
								.title('Published')
								.icon(CheckmarkIcon)
								.child(
									S.documentList()
										.title('Published')
										.schemaType('propertyListing')
										.filter(filterFor(PUBLISHED_PREDICATE))
										.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
								),
							S.listItem()
								.title('Unpublished')
								.icon(EyeClosedIcon)
								.child(
									S.documentList()
										.title('Unpublished')
										.schemaType('propertyListing')
										.filter(filterFor(UNPUBLISHED_PREDICATE))
										.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
								),
							S.divider(),
							S.listItem()
								.title('Published but blocked')
								.icon(WarningOutlineIcon)
								.child(
									S.documentList()
										.title('Published but blocked')
										.schemaType('propertyListing')
										.filter(filterFor(PUBLISHED_BUT_BLOCKED_PREDICATE))
										.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
								)
						])
				)
		]);
