import type { StructureResolver } from 'sanity/structure';

const APPROVED_FOR_PUBLISH = 'approved_for_publish';

/** Documents with workflow whose publish readiness is not approved. */
const NEEDS_REVIEW_FILTER = `_type in ["propertyListing", "development", "unit", "unitType"] && coalesce(workflow.publishReadiness, "") != "${APPROVED_FOR_PUBLISH}"`;

export const deskStructure: StructureResolver = (S) =>
	S.list()
		.title('Content')
		.items([
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
				.schemaType('locationTaxonomy')
				.child(S.documentTypeList('locationTaxonomy').title('Locations')),
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
						.filter(NEEDS_REVIEW_FILTER)
						.defaultOrdering([{ field: '_updatedAt', direction: 'desc' }])
				)
		]);
