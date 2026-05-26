import { defineArrayMember, defineField, defineType } from 'sanity';
import {
	BROCHURE_VISIBILITY,
	BUILD_STATUSES,
	COMPLETION_STATUSES,
	DEVELOPMENT_DISPLAY_MODES,
	DEVELOPMENT_STATUSES
} from '../constants/enums';
import { ghiListingIdRule, validatePricingFields } from '../validators/rules';

export const development = defineType({
	name: 'development',
	title: 'Development',
	type: 'document',
	groups: [
		{ name: 'identity', title: 'Identity', default: true },
		{ name: 'location', title: 'Location' },
		{ name: 'development', title: 'Development details' },
		{ name: 'pricing', title: 'Pricing & availability' },
		{ name: 'units', title: 'Units & typologies' },
		{ name: 'content', title: 'Content & media' },
		{ name: 'golf', title: 'Golf' },
		{ name: 'seo', title: 'SEO & CTAs' },
		{ name: 'governance', title: 'Governance & workflow' }
	],
	fields: [
		defineField({
			name: 'ghiListingId',
			title: 'GHI listing ID',
			type: 'string',
			group: 'identity',
			description: 'Canonical public ID in GHIXXXXX format.',
			validation: (Rule) => ghiListingIdRule(Rule)
		}),
		defineField({
			name: 'developmentName',
			title: 'Development name',
			type: 'string',
			group: 'identity',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'publicTitle',
			title: 'Public title',
			type: 'string',
			group: 'identity',
			description: 'Page H1/title — clean of internal shorthand and unreviewed price hints.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'identity',
			options: { source: 'publicTitle', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'listingKind',
			title: 'Listing kind',
			type: 'string',
			group: 'identity',
			readOnly: true,
			initialValue: 'development',
			hidden: true
		}),
		defineField({
			name: 'developmentDisplayMode',
			title: 'Development display mode',
			type: 'string',
			group: 'development',
			options: { list: [...DEVELOPMENT_DISPLAY_MODES], layout: 'dropdown' },
			validation: (Rule) => Rule.required(),
			description:
				'Private/internal template control — how the public development page renders units and pricing.'
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'locationFields',
			group: 'location'
		}),
		defineField({
			name: 'developmentStatus',
			title: 'Development status',
			type: 'string',
			group: 'development',
			options: { list: [...DEVELOPMENT_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'buildStatus',
			title: 'Build status',
			type: 'string',
			group: 'development',
			options: { list: [...BUILD_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'completionDate',
			title: 'Completion date',
			type: 'date',
			group: 'development'
		}),
		defineField({
			name: 'completionStatus',
			title: 'Completion status',
			type: 'string',
			group: 'development',
			options: { list: [...COMPLETION_STATUSES], layout: 'dropdown' }
		}),
		defineField({
			name: 'developerName',
			title: 'Developer name',
			type: 'string',
			group: 'development',
			description: 'Public only when source-supported and approved.'
		}),
		defineField({
			name: 'architectureStudio',
			title: 'Architecture studio',
			type: 'string',
			group: 'development',
			description: 'Public only when source-supported and approved.'
		}),
		defineField({
			name: 'developmentComposition',
			title: 'Development composition',
			type: 'array',
			group: 'development',
			of: [{ type: 'string' }],
			description: 'Summary of what the development comprises (e.g. "45 villas, clubhouse, spa").'
		}),
		defineField({
			name: 'pricing',
			title: 'Pricing & availability',
			type: 'pricingFields',
			group: 'pricing',
			description: 'Use price from / price to for development range summaries.'
		}),
		defineField({
			name: 'availabilitySummary',
			title: 'Availability summary',
			type: 'string',
			group: 'pricing',
			description: 'Public summary when approved (e.g. "12 units remaining").'
		}),
		defineField({
			name: 'unitTypes',
			title: 'Unit types',
			type: 'array',
			group: 'units',
			of: [defineArrayMember({ type: 'reference', to: [{ type: 'unitType' }] })],
			description: 'Linked typologies — public output filtered by visibility and reserved status.'
		}),
		defineField({
			name: 'units',
			title: 'Units',
			type: 'array',
			group: 'units',
			of: [defineArrayMember({ type: 'reference', to: [{ type: 'unit' }] })],
			description: 'Linked units — reserved and hidden units excluded from public output.'
		}),
		defineField({
			name: 'sharedAmenities',
			title: 'Shared amenities',
			type: 'array',
			group: 'development',
			of: [defineArrayMember({ type: 'featureHighlight' })]
		}),
		defineField({
			name: 'sharedGallery',
			title: 'Shared gallery',
			type: 'array',
			group: 'content',
			of: [defineArrayMember({ type: 'mediaAssetMetadata' })],
			description: 'Approved shared development imagery.'
		}),
		defineField({
			name: 'media',
			title: 'Media',
			type: 'mediaFields',
			group: 'content'
		}),
		defineField({
			name: 'brochureVisibility',
			title: 'Brochure visibility',
			type: 'string',
			group: 'content',
			options: { list: [...BROCHURE_VISIBILITY], layout: 'dropdown' },
			initialValue: 'request_only',
			description: 'Disabled or request-only until explicitly approved for public download.'
		}),
		defineField({
			name: 'content',
			title: 'Content',
			type: 'contentFields',
			group: 'content'
		}),
		defineField({
			name: 'golf',
			title: 'Golf',
			type: 'golfFields',
			group: 'golf'
		}),
		defineField({
			name: 'ctas',
			title: 'Enquiry & CTAs',
			type: 'ctaFields',
			group: 'seo'
		}),
		defineField({
			name: 'seo',
			title: 'SEO',
			type: 'seoFields',
			group: 'seo'
		}),
		defineField({
			name: 'sourceFolderUrl',
			title: 'Source folder URL',
			type: 'url',
			group: 'governance',
			description: 'Private/internal — Google Drive folder reference.'
		}),
		defineField({
			name: 'sourceProvenance',
			title: 'Source provenance',
			type: 'array',
			group: 'governance',
			of: [defineArrayMember({ type: 'sourceProvenance' })],
			description: 'Private/internal — never returned in public payloads.'
		}),
		defineField({
			name: 'workflow',
			title: 'Workflow & readiness',
			type: 'workflowFields',
			group: 'governance'
		}),
		defineField({
			name: 'sensitiveGovernance',
			title: 'Sensitive governance',
			type: 'sensitiveGovernanceFields',
			group: 'governance'
		})
	],
	validation: (Rule) =>
		Rule.custom((document) => {
			const doc = document as {
				listingKind?: string;
				pricing?: Parameters<typeof validatePricingFields>[0];
			};

			if (doc?.listingKind && doc.listingKind !== 'development') {
				return 'Developments must have listing kind "development".';
			}

			return validatePricingFields(doc?.pricing);
		}),
	preview: {
		select: {
			title: 'developmentName',
			publicTitle: 'publicTitle',
			ghiId: 'ghiListingId',
			location: 'location.location.name',
			displayMode: 'developmentDisplayMode'
		},
		prepare({ title, publicTitle, ghiId, location: locationName, displayMode }) {
			const subtitle = [ghiId, locationName, displayMode?.replace(/_/g, ' ')].filter(Boolean).join(' · ');
			return {
				title: title || publicTitle || 'Development',
				subtitle: subtitle || undefined
			};
		}
	}
});
