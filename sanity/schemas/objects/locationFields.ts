import { defineField, defineType } from 'sanity';
import { LocationFieldsInput } from '../../components/LocationFieldsInput';
import { ReadOnlyReferenceInput } from '../../components/ReadOnlyReferenceInput';
import {
	isParentChainSynced,
	PARENT_CHAIN_QUERY,
	type LocationFieldsValue
} from '../../lib/locationFieldsSync';

export const locationFields = defineType({
	name: 'locationFields',
	title: 'Location',
	type: 'object',
	components: {
		input: LocationFieldsInput
	},
	fields: [
		defineField({
			name: 'community',
			title: 'Community',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			options: {
				filter: 'type == "community"'
			},
			description: 'Pick the community — location and country below are filled in automatically.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'location',
			title: 'Location',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			description: 'Derived from the selected community. Change the community above to update this.',
			components: {
				input: ReadOnlyReferenceInput
			}
		}),
		defineField({
			name: 'country',
			title: 'Country',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			description: 'Derived from the selected community. Change the community above to update this.',
			components: {
				input: ReadOnlyReferenceInput
			}
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
	validation: (Rule) =>
		Rule.custom(async (fields, context) => {
			const location = fields as LocationFieldsValue | undefined;
			const communityRef = location?.community?._ref;
			if (!communityRef) return true;

			const client = context.getClient({ apiVersion: '2024-01-01' });
			const chain = await client.fetch(PARENT_CHAIN_QUERY, { id: communityRef });

			if (!isParentChainSynced(location ?? {}, chain)) {
				return 'Location and country are out of sync with the selected community. Re-select the community or wait a moment for them to update, then publish again.';
			}

			return true;
		}),
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
