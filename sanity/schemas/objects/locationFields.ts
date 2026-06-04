import { defineField, defineType } from 'sanity';
import { LocationFieldsInput } from '../../components/LocationFieldsInput';

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
			description: 'The full street address. Internal only — not shown on the website.'
		})
	],
	preview: {
		select: {
			addressDisplay: 'addressDisplay',
			communityName: 'community.name'
		},
		prepare({ addressDisplay, communityName }) {
			return {
				title: addressDisplay || 'Location',
				subtitle: communityName ?? undefined
			};
		}
	}
});
