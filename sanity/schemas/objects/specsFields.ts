import { defineField, defineType } from 'sanity';
import { AREA_UNITS, GARDEN_TYPES, ORIENTATIONS, POOL_TYPES, VIEW_TYPES } from '../constants/enums';

export const specsFields = defineType({
	name: 'specsFields',
	title: 'Specifications',
	type: 'object',
	fields: [
		defineField({
			name: 'bedrooms',
			title: 'Bedrooms',
			type: 'number',
			validation: (Rule) => Rule.min(0).integer()
		}),
		defineField({
			name: 'bathrooms',
			title: 'Bathrooms',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'builtArea',
			title: 'Built area',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'builtAreaUnit',
			title: 'Built area unit',
			type: 'string',
			options: { list: [...AREA_UNITS], layout: 'dropdown' },
			initialValue: 'sqm'
		}),
		defineField({
			name: 'plotSize',
			title: 'Plot size',
			type: 'number',
			description: 'Total land plot size. Usually required for villas — apartments typically use the terrace or garden area fields instead.',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'plotSizeUnit',
			title: 'Plot size unit',
			type: 'string',
			options: { list: [...AREA_UNITS], layout: 'dropdown' },
			initialValue: 'sqm'
		}),
		defineField({
			name: 'terraceSize',
			title: 'Terrace size',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'interiorArea',
			title: 'Interior area',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'exteriorArea',
			title: 'Exterior area',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'gardenArea',
			title: 'Garden area',
			type: 'number',
			validation: (Rule) => Rule.min(0)
		}),
		defineField({
			name: 'levels',
			title: 'Levels',
			type: 'number',
			validation: (Rule) => Rule.min(0).integer()
		}),
		defineField({
			name: 'pool',
			title: 'Pool',
			type: 'string',
			options: { list: [...POOL_TYPES], layout: 'dropdown' }
		}),
		defineField({
			name: 'garden',
			title: 'Garden',
			type: 'string',
			options: { list: [...GARDEN_TYPES], layout: 'dropdown' }
		}),
		defineField({
			name: 'orientation',
			title: 'Orientation',
			type: 'string',
			options: { list: [...ORIENTATIONS], layout: 'dropdown' }
		}),
		defineField({
			name: 'views',
			title: 'Views',
			type: 'array',
			of: [
				{
					type: 'string',
					options: { list: [...VIEW_TYPES], layout: 'dropdown' }
				}
			]
		})
	],
	preview: {
		select: {
			bedrooms: 'bedrooms',
			bathrooms: 'bathrooms',
			builtArea: 'builtArea',
			builtAreaUnit: 'builtAreaUnit'
		},
		prepare({ bedrooms, bathrooms, builtArea, builtAreaUnit }) {
			const parts = [
				bedrooms != null ? `${bedrooms} bed` : null,
				bathrooms != null ? `${bathrooms} bath` : null,
				builtArea != null ? `${builtArea} ${builtAreaUnit || 'sqm'}` : null
			].filter(Boolean);

			return {
				title: parts.length ? parts.join(' · ') : 'Specifications'
			};
		}
	}
});
