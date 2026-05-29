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
	'media.heroImage.publicUseApproved != true',
	'count(media.gallery[publicUseApproved != true]) > 0',
	'count(media.gallery[imageRightsStatus in ["needs_review", "needs_rights_review", "specific_concern"]]) > 0',
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
				.title('Locations')
				.child(
					S.list()
						.title('Locations')
						.items([
							S.listItem()
								.title('Countries')
								.schemaType('locationTaxonomy')
								.child(
									S.documentList()
										.title('Countries')
										.schemaType('locationTaxonomy')
										.filter('_type == "locationTaxonomy" && type == "country"')
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								),
							S.listItem()
								.title('Locations')
								.schemaType('locationTaxonomy')
								.child(
									S.documentList()
										.title('Locations')
										.schemaType('locationTaxonomy')
										.filter('_type == "locationTaxonomy" && type == "location"')
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								),
							S.listItem()
								.title('Communities')
								.schemaType('locationTaxonomy')
								.child(
									S.documentList()
										.title('Communities')
										.schemaType('locationTaxonomy')
										.filter('_type == "locationTaxonomy" && type == "community"')
										.defaultOrdering([{ field: 'name', direction: 'asc' }])
								)
						])
				),
			S.listItem()
				.title('Golf courses')
				.schemaType('golfCourse')
				.child(S.documentTypeList('golfCourse').title('Golf courses')),
			S.divider(),
			S.listItem()
				.title('Needs review')
				.child(
					S.documentList()
						.title('Needs review')
						.schemaType('propertyListing')
						.filter(NEEDS_REVIEW_FILTER)
						.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
				)
		]);
