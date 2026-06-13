import { defineArrayMember, defineField, defineType } from 'sanity';
import { GUIDE_CALLOUT_TONES } from '../constants/enums';

/**
 * A short editorial aside inside a guide section ("Good to know", "Important").
 * Body is plain text; blank lines split paragraphs on the website.
 */
export const guideCallout = defineType({
	name: 'guideCallout',
	title: 'Callout',
	type: 'object',
	fields: [
		defineField({
			name: 'tone',
			title: 'Tone',
			type: 'string',
			options: { list: [...GUIDE_CALLOUT_TONES], layout: 'radio' },
			initialValue: 'note',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			description: 'Optional short label, e.g. "Good to know".'
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 4,
			validation: (Rule) => Rule.required()
		})
	],
	preview: {
		select: { title: 'title', tone: 'tone', body: 'body' },
		prepare({ title, tone, body }) {
			const toneLabel = GUIDE_CALLOUT_TONES.find((t) => t.value === tone)?.title ?? tone;
			return { title: title || body || 'Callout', subtitle: `Callout · ${toneLabel}` };
		}
	}
});

/**
 * A compact label/value reference table (costs, tax rates, timelines). Renders as a
 * hairline-ruled definition list, not a property data block.
 */
export const guideKeyFigures = defineType({
	name: 'guideKeyFigures',
	title: 'Key figures',
	type: 'object',
	fields: [
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string',
			description: 'Optional label above the figures, e.g. "Typical purchase costs".'
		}),
		defineField({
			name: 'rows',
			title: 'Rows',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'object',
					name: 'figure',
					fields: [
						defineField({
							name: 'label',
							title: 'Label',
							type: 'string',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'value',
							title: 'Value',
							type: 'string',
							validation: (Rule) => Rule.required()
						}),
						defineField({
							name: 'note',
							title: 'Note',
							type: 'string',
							description: 'Optional clarifying detail shown beneath the value.'
						})
					],
					preview: {
						select: { title: 'label', subtitle: 'value' }
					}
				})
			],
			validation: (Rule) => Rule.required().min(1)
		})
	],
	preview: {
		select: { caption: 'caption', rows: 'rows' },
		prepare({ caption, rows }) {
			const count = Array.isArray(rows) ? rows.length : 0;
			return {
				title: caption || 'Key figures',
				subtitle: `${count} ${count === 1 ? 'row' : 'rows'}`
			};
		}
	}
});

/** The rich-text body of a guide section: prose, callouts, key figures, images. */
const guideSectionBody = defineField({
	name: 'body',
	title: 'Body',
	type: 'array',
	of: [
		defineArrayMember({
			type: 'block',
			styles: [
				{ title: 'Normal', value: 'normal' },
				{ title: 'Heading', value: 'h3' },
				{ title: 'Subheading', value: 'h4' },
				{ title: 'Quote', value: 'blockquote' }
			],
			lists: [
				{ title: 'Bulleted', value: 'bullet' },
				{ title: 'Numbered', value: 'number' }
			],
			marks: {
				decorators: [
					{ title: 'Bold', value: 'strong' },
					{ title: 'Italic', value: 'em' }
				],
				annotations: [
					defineArrayMember({
						name: 'link',
						title: 'Link',
						type: 'object',
						fields: [
							defineField({
								name: 'href',
								title: 'URL',
								type: 'url',
								validation: (Rule) =>
									Rule.required().uri({
										allowRelative: true,
										scheme: ['http', 'https', 'mailto', 'tel']
									})
							})
						]
					})
				]
			}
		}),
		defineArrayMember({ type: 'guideCallout' }),
		defineArrayMember({ type: 'guideKeyFigures' }),
		defineArrayMember({ type: 'mediaAssetMetadata', title: 'Image' })
	],
	validation: (Rule) => Rule.required().min(1)
});

/**
 * One chapter of a guide. The heading drives the in-page contents rail and the URL
 * anchor; the body carries the editorial content. An ordered array of these is what
 * makes a guide long-form yet consistently structured across every guide type.
 */
export const guideSection = defineType({
	name: 'guideSection',
	title: 'Section',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'anchor',
			title: 'Anchor',
			type: 'slug',
			options: { source: 'heading', maxLength: 96 },
			description: 'URL anchor for this chapter (linked from the contents rail). Auto-filled from the heading.',
			validation: (Rule) => Rule.required()
		}),
		guideSectionBody
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }) {
			return { title: title || 'Section' };
		}
	}
});
