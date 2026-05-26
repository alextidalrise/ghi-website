import { defineField, defineType } from 'sanity';
import { COORDINATE_SOURCES, MAP_PRIVACY_LEVELS } from '../constants/enums';
import { validateLocationFields } from '../validators/rules';

export const locationFields = defineType({
	name: 'locationFields',
	title: 'Location',
	type: 'object',
	fields: [
		defineField({
			name: 'country',
			title: 'Country',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'community',
			title: 'Community',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }]
		}),
		defineField({
			name: 'microLocation',
			title: 'Micro-location',
			type: 'string',
			description: 'Optional finer-grained location label for public display.'
		}),
		defineField({
			name: 'addressDisplay',
			title: 'Address display',
			type: 'string',
			description: 'Safe public-facing location string.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'exactAddressInternal',
			title: 'Exact address (internal)',
			type: 'string',
			description: 'Private/internal — never expose unless manually approved through map privacy workflow.'
		}),
		defineField({
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
			description:
				'Private/internal raw coordinate. Public output must be transformed by mapPrivacyLevel — never sent directly.'
		}),
		defineField({
			name: 'coordinateSource',
			title: 'Coordinate source',
			type: 'string',
			options: { list: [...COORDINATE_SOURCES], layout: 'dropdown' },
			initialValue: 'unknown'
		}),
		defineField({
			name: 'mapPrivacyLevel',
			title: 'Map privacy level',
			type: 'string',
			options: { list: [...MAP_PRIVACY_LEVELS], layout: 'radio' },
			validation: (Rule) =>
				Rule.required().warning('Map privacy level is required before any map module can render publicly.'),
			description: 'Controls how coordinates are transformed or suppressed on public pages.'
		}),
		defineField({
			name: 'mapDisplayApproved',
			title: 'Map display approved',
			type: 'boolean',
			initialValue: false,
			description: 'Required when mapPrivacyLevel is exact and coordinates are set.'
		}),
		defineField({
			name: 'mapDisplayApprovedBy',
			title: 'Map display approved by',
			type: 'string'
		}),
		defineField({
			name: 'mapDisplayApprovedAt',
			title: 'Map display approved at',
			type: 'datetime'
		}),
		defineField({
			name: 'publicMapNotes',
			title: 'Public map notes',
			type: 'text',
			rows: 2,
			description: 'Private/internal workflow notes for map display decisions.'
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => validateLocationFields(value as Parameters<typeof validateLocationFields>[0])),
	preview: {
		select: {
			addressDisplay: 'addressDisplay',
			mapPrivacyLevel: 'mapPrivacyLevel'
		},
		prepare({ addressDisplay, mapPrivacyLevel }) {
			return {
				title: addressDisplay || 'Location',
				subtitle: mapPrivacyLevel ? `Map: ${mapPrivacyLevel}` : undefined
			};
		}
	}
});
