import { defineField, defineType } from 'sanity';

export const homepageContent = defineType({
	name: 'homepageContent',
	title: 'Homepage content',
	type: 'object',
	fields: [
		defineField({
			name: 'heroHeadline',
			title: 'Hero headline',
			type: 'string',
			description:
				'The large display heading on the homepage hero. Wrap a phrase in *asterisks* to render it in italic. Defaults to "Homes beside the fairway".',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'buyerIntroHeading',
			title: 'Buyer introduction heading',
			type: 'string',
			description: 'Heading for the buyer-guides introduction module.'
		}),
		defineField({
			name: 'buyerIntroDeck',
			title: 'Buyer introduction deck',
			type: 'text',
			rows: 3,
			description: 'Supporting paragraph below the buyer introduction heading.'
		}),
		defineField({
			name: 'buyerIntroCta',
			title: 'Buyer introduction CTA',
			type: 'string',
			description: 'Label on the button linking to the guides hub.'
		}),
		defineField({
			name: 'featuredHeading',
			title: 'Featured properties heading',
			type: 'string'
		}),
		defineField({
			name: 'featuredSummary',
			title: 'Featured properties summary',
			type: 'string',
			description: 'Support line beneath the featured properties heading.'
		}),
		defineField({
			name: 'frontlineHeading',
			title: 'Frontline section heading',
			type: 'string'
		}),
		defineField({
			name: 'frontlineSummary',
			title: 'Frontline section summary',
			type: 'string',
			description: 'Support line beneath the frontline section heading.'
		}),
		defineField({
			name: 'destinationsHeading',
			title: 'Destinations heading',
			type: 'string',
			description: 'Heading above the explore-by-country grid.'
		}),
		defineField({
			name: 'partnersHeading',
			title: 'Partners heading',
			type: 'string'
		}),
		defineField({
			name: 'partnersSubhead',
			title: 'Partners subhead',
			type: 'string'
		}),
		defineField({
			name: 'partnersCta',
			title: 'Partners CTA label',
			type: 'string'
		}),
		defineField({
			name: 'partnersCtaSupport',
			title: 'Partners CTA support text',
			type: 'text',
			rows: 2
		}),
		defineField({
			name: 'reviewsHeading',
			title: 'Reviews heading',
			type: 'string'
		}),
		defineField({
			name: 'reviewsDeck',
			title: 'Reviews deck',
			type: 'string',
			description: 'Support line beneath the reviews heading.'
		}),
		defineField({
			name: 'primaryCtaLabel',
			title: 'Primary CTA label',
			type: 'string',
			description: 'Label on the main call-to-action button.'
		}),
		defineField({
			name: 'primaryCtaRoute',
			title: 'Primary CTA route',
			type: 'string',
			description: 'Path the primary CTA links to, e.g. "/contact".'
		})
	]
});
