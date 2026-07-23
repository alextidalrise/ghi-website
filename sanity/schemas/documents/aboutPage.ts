import { defineArrayMember, defineField, defineType } from 'sanity';

const portableTextField = (name: string, title: string, description?: string) =>
	defineField({
		name,
		title,
		type: 'array',
		of: [defineArrayMember({ type: 'block' })],
		description
	});

export const aboutPage = defineType({
	name: 'aboutPage',
	title: 'About',
	type: 'document',
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'seo', title: 'SEO' }
	],
	fields: [
		defineField({
			name: 'heroTitle',
			title: 'Hero title',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'heroLead',
			title: 'Hero lead',
			type: 'text',
			rows: 3,
			group: 'content'
		}),

		defineField({
			name: 'storyHeading',
			title: 'Story heading',
			type: 'string',
			group: 'content'
		}),
		portableTextField(
			'storyBody',
			'Story body',
			'The "Our story" narrative. Use paragraphs and blockquotes.'
		),
		defineField({
			name: 'storyQuote',
			title: 'Story pull-quote',
			type: 'text',
			rows: 3,
			description: 'Standalone pull-quote rendered after the story body.',
			group: 'content'
		}),

		defineField({
			name: 'networkHeading',
			title: 'Trusted-network heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'networkBody',
			title: 'Trusted-network body',
			type: 'text',
			rows: 4,
			group: 'content'
		}),
		defineField({
			name: 'networkChips',
			title: 'Network labels',
			type: 'array',
			of: [defineArrayMember({ type: 'string' })],
			description: 'Short specialist labels displayed as chips (e.g. "Lawyers", "Tax advisers").',
			options: { layout: 'tags' },
			group: 'content'
		}),
		defineField({
			name: 'networkCta',
			title: 'Network CTA label',
			type: 'string',
			description: 'Label on the button linking to partners.',
			group: 'content'
		}),

		defineField({
			name: 'placesHeading',
			title: 'Places heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'placesBody',
			title: 'Places body',
			type: 'text',
			rows: 4,
			group: 'content'
		}),
		defineField({
			name: 'places',
			title: 'Places',
			type: 'array',
			description: 'Destination tiles shown in the "Why these places" section. Each can link to a page on the site.',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({
							name: 'name',
							title: 'Name',
							type: 'string',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'region',
							title: 'Region',
							type: 'string',
							description: 'Sub-label, e.g. "Costa del Sol, Spain".'
						}),
						defineField({
							name: 'heroSlug',
							title: 'Hero image slug',
							type: 'string',
							description: 'Slug of the location whose hero image to display (e.g. "marbella", "quinta-do-lago").',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'alt',
							title: 'Image alt text',
							type: 'string'
						}),
						defineField({
							name: 'href',
							title: 'Link',
							type: 'string',
							description: 'Internal path this tile links to, e.g. "/spain/marbella". Leave empty for no link.'
						})
					],
					preview: {
						select: { title: 'name', subtitle: 'href' }
					}
				})
			],
			group: 'content'
		}),

		defineField({
			name: 'teamHeading',
			title: 'Team heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'teamMembers',
			title: 'Team members',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					fields: [
						defineField({
							name: 'name',
							title: 'Name',
							type: 'string',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'role',
							title: 'Role',
							type: 'string'
						}),
						defineField({
							name: 'bio',
							title: 'Bio',
							type: 'text',
							rows: 4
						}),
						defineField({
							name: 'image',
							title: 'Photo',
							type: 'mediaAssetMetadata'
						})
					],
					preview: {
						select: { title: 'name', subtitle: 'role', media: 'image.asset' }
					}
				})
			],
			group: 'content'
		}),
		defineField({
			name: 'teamContactFlag',
			title: 'Team contact flag',
			type: 'string',
			description: 'Label shown on the lead team member card (e.g. "Your first point of contact").',
			group: 'content'
		}),

		defineField({
			name: 'closingHeading',
			title: 'Closing CTA heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'closingBody',
			title: 'Closing CTA body',
			type: 'text',
			rows: 3,
			group: 'content'
		}),
		defineField({
			name: 'closingPrimaryCta',
			title: 'Closing primary CTA label',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'closingPrimaryRoute',
			title: 'Closing primary CTA route',
			type: 'string',
			description: 'Path the primary CTA links to, e.g. "/contact".',
			group: 'content'
		}),
		defineField({
			name: 'closingSecondaryCta',
			title: 'Closing secondary CTA label',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'closingSecondaryRoute',
			title: 'Closing secondary CTA route',
			type: 'string',
			description: 'Path the secondary CTA links to, e.g. "/front-line-collection".',
			group: 'content'
		}),

		defineField({
			name: 'reviewsHeading',
			title: 'Reviews heading',
			type: 'string',
			description: 'Heading override for the reviews section.',
			group: 'content'
		}),

		defineField({
			name: 'seo',
			title: 'SEO metadata',
			type: 'seoFields',
			group: 'seo'
		})
	],
	preview: {
		prepare() {
			return { title: 'About' };
		}
	}
});
