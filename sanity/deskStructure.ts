import { BookIcon, DesktopIcon, EarthAmericasIcon, EyeOpenIcon } from '@sanity/icons';
import type { StructureResolver } from 'sanity/structure';

/**
 * Individual review-blocker GROQ predicates. A propertyListing appears in the
 * "Needs review" view when ANY of these evaluate to true. Once every blocker is
 * resolved and the document is saved, the listing drops out automatically.
 */
const REVIEW_BLOCKERS = [
	'workflow.humanReviewed != true',
	'workflow.publishReadiness == "governance_hold"',
	'sensitiveGovernance.sensitiveReviewStatus in ["pending", "in_review", "blocked"]',
	'sensitiveGovernance.requiresHumanApproval == true',
	'count(sourceProvenance[publicSafeStatus == "needs_review"]) > 0',
	'count(workflow.reviewItems[blocksPublish == true]) > 0 || count(workflow.factsNeedingConfirmation) > 0 || count(workflow.missingSourceFields) > 0',
];

const NEEDS_REVIEW_FILTER = `_type == "propertyListing" && (${REVIEW_BLOCKERS.join(' || ')})`;

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
			S.divider(),
			S.listItem()
				.title('Needs review')
				.icon(EyeOpenIcon)
				.child(
					S.documentList()
						.title('Needs review')
						.schemaType('propertyListing')
						.filter(NEEDS_REVIEW_FILTER)
						.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
				)
		]);
