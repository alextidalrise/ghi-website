import { defineField, defineType } from 'sanity';

/**
 * The byline behind an Insights article. A dedicated document (rather than a free
 * string) so an author is authored once and reused across every piece, carries an
 * optional portrait for the byline, and can headline an author archive page later.
 * House-written pieces use the "Golf Homes International" record.
 */
export const author = defineType({
	name: 'author',
	title: 'Author',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			description: 'Byline as it should read, e.g. "Golf Homes International" or "Elena Marsh".',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			options: { source: 'name', maxLength: 96 },
			description: 'Used for a future author archive page. Auto-filled from the name.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'role',
			title: 'Role',
			type: 'string',
			description: 'Optional title shown beneath the name, e.g. "Editorial team" or "Head of Sales".',
			validation: (Rule) => Rule.max(60)
		}),
		defineField({
			name: 'avatar',
			title: 'Portrait',
			type: 'mediaAssetMetadata',
			description: 'Optional square headshot for the byline. Falls back to initials when blank.'
		}),
		defineField({
			name: 'bio',
			title: 'Bio',
			type: 'text',
			rows: 3,
			description: 'Optional short biography for the article footer and author page.'
		})
	],
	preview: {
		select: { title: 'name', subtitle: 'role', media: 'avatar.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || 'Author', subtitle: subtitle || undefined, media };
		}
	}
});
