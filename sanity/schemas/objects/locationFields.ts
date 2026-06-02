import { defineField, defineType } from 'sanity';
import { LocationFieldsInput } from '../../components/LocationFieldsInput';
import { COORDINATE_SOURCES, MAP_PRIVACY_LEVELS } from '../constants/enums';
import { validateLocationFields } from '../validators/rules';

export const locationFields = defineType({
	name: 'locationFields',
	title: 'Location',
	type: 'object',
	components: {
		input: LocationFieldsInput
	},
	fields: [
		defineField({
			name: 'country',
			title: 'Country',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			hidden: true
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			hidden: true
		}),
		defineField({
			name: 'community',
			title: 'Community',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			options: {
				filter: 'type == "community"'
			},
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'addressDisplay',
			title: 'Address display',
			type: 'string',
			description: 'The location label shown to buyers on the website (e.g. "Marbella, Costa del Sol"). Keep this general enough to protect the exact address.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'exactAddressInternal',
			title: 'Exact address (internal)',
			type: 'string',
			description: 'The full street address. Internal only — only made public if specifically approved through the map privacy process.'
		}),
		defineField({
			name: 'coordinates',
			title: 'Coordinates',
			type: 'geopoint',
			description:
				'Exact GPS location. Internal only — adjusted or hidden on the public map according to the Map Privacy Level setting.'
		}),
		defineField({
			name: 'coordinateSource',
			title: 'Coordinate source',
			type: 'string',
			options: { list: [...COORDINATE_SOURCES], layout: 'dropdown' },
			initialValue: 'unknown',
			description: 'How the coordinates were obtained (e.g. manually placed pin, geocoded from address).'
		}),
		defineField({
			name: 'mapPrivacyLevel',
			title: 'Map privacy level',
			type: 'string',
			options: { list: [...MAP_PRIVACY_LEVELS], layout: 'radio' },
			validation: (Rule) =>
				Rule.required().warning('Map privacy level is required before any map module can render publicly.'),
			description: 'Determines how the map pin appears publicly — exact location, approximate area only, or completely hidden.'
		}),
		defineField({
			name: 'mapDisplayApproved',
			title: 'Map display approved',
			type: 'boolean',
			initialValue: false,
			description: 'Must be ticked before an exact pin location is shown on the public map. Only applies when Map Privacy Level is set to exact.'
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
			description: 'Internal notes about map display decisions for this property. Not shown on the website.'
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
