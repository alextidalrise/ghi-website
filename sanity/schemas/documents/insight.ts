import { defineField, defineType } from 'sanity';
import { INSIGHT_CATEGORIES } from '../constants/enums';

/**
 * An editorial "Insights" article — GHI's journal. One document type serves every
 * article: the `insightCategory` field branches the topic (mirroring how `guide`
 * branches on `guideCategory`), doubling as the article kicker and the /insights
 * filter chip. Insights is a dated, reverse-chronological feed and stays separate
 * from Guides, though the two share the same editorial body vocabulary.
 *
 * The body reuses the guide content objects (callout, key figures, inline image)
 * for now; the dedicated Insights block library is shaped with the post template.
 */
export const insight = defineType({
	name: 'insight',
	title: 'Insight',
	type: 'document',
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'seo', title: 'SEO' }
	],
	fields: [
		defineField({
			name: 'title',
			title: 'Title',
			type: 'string',
			group: 'content',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'titleEmphasis',
			title: 'Title — italic phrase',
			type: 'string',
			group: 'content',
			description:
				'Optional. A phrase copied from the title, word for word, to set in italic on the article hero — e.g. "Golf Course Living". One phrase per headline; it is the article\'s display moment, not a highlighter. Leave blank for a plain headline.',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					if (!value) return true;
					const title = (context.document?.title as string | undefined) ?? '';
					return title.includes(value)
						? true
						: 'This phrase does not appear in the title. It has to match the title exactly, including punctuation and capitals.';
				})
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			group: 'content',
			options: { source: 'title', maxLength: 96 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'insightCategory',
			title: 'Category',
			type: 'string',
			group: 'content',
			options: { list: [...INSIGHT_CATEGORIES], layout: 'dropdown' },
			initialValue: 'lifestyle',
			description: 'Shown as the article kicker and the filter chip on the Insights index.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'author',
			title: 'Author',
			type: 'reference',
			group: 'content',
			to: [{ type: 'author' }],
			description: 'The byline. House pieces use the "Golf Homes International" author.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'publishedAt',
			title: 'Published',
			type: 'datetime',
			group: 'content',
			description: 'Drives the reverse-chronological order and the displayed date.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'featured',
			title: 'Feature on the Insights front',
			type: 'boolean',
			group: 'content',
			initialValue: false,
			description:
				'When set, this article takes the large lead slot at the top of the Insights index. If several are flagged, the most recent wins; otherwise the newest article leads.'
		}),
		defineField({
			name: 'subhead',
			title: 'Subhead',
			type: 'text',
			rows: 3,
			group: 'content',
			description:
				'The short intro shown under the headline on the article, and as the summary on the Insights index card. 1–3 sentences, so it has to read well in both places.',
			validation: (Rule) => Rule.required().max(280)
		}),
		defineField({
			name: 'heroImage',
			title: 'Hero image',
			type: 'mediaAssetMetadata',
			group: 'content',
			description: 'Lead photograph for the article hero and its index card.'
		}),
		defineField({
			name: 'heroCaption',
			title: 'Hero caption',
			type: 'string',
			group: 'content',
			description: 'Optional caption, shown inside the frame beneath the hero image.',
			validation: (Rule) => Rule.max(160)
		}),
		defineField({
			name: 'heroNote',
			title: 'Hero note',
			type: 'insightHeroNote',
			group: 'content',
			description:
				'Optional framed note under the hero image: the article\'s thesis in one line, before the reader has scrolled. Leave blank and the hero runs image-only.'
		}),
		defineField({
			name: 'readingTimeOverride',
			title: 'Reading time override (minutes)',
			type: 'number',
			group: 'content',
			description: 'Leave blank to compute automatically from the body length.',
			validation: (Rule) => Rule.min(1).integer()
		}),
		defineField({
			name: 'sections',
			title: 'Sections',
			type: 'array',
			group: 'content',
			of: [{ type: 'insightSection' }],
			description: 'The article, in reading order. Each section becomes a contents-rail entry.',
			validation: (Rule) => Rule.required().min(1)
		}),
		defineField({
			name: 'ctaHeading',
			title: 'Closing CTA heading',
			type: 'string',
			group: 'content',
			description: 'Optional override for the closing enquiry band heading.'
		}),
		defineField({
			name: 'ctaBody',
			title: 'Closing CTA body',
			type: 'text',
			rows: 2,
			group: 'content',
			description: 'Optional override for the closing enquiry band copy.'
		}),
		defineField({
			name: 'relatedInsights',
			title: 'Related articles (override)',
			type: 'array',
			group: 'content',
			of: [{ type: 'reference', to: [{ type: 'insight' }] }],
			description:
				'Optional hand-picked related articles. Leave empty to show the newest others in the same category automatically.',
			validation: (Rule) => Rule.max(3).unique()
		}),
		defineField({
			name: 'seo',
			title: 'SEO metadata',
			type: 'seoFields',
			group: 'seo'
		})
	],
	orderings: [
		{
			title: 'Published, newest first',
			name: 'publishedDesc',
			by: [{ field: 'publishedAt', direction: 'desc' }]
		}
	],
	preview: {
		select: {
			title: 'title',
			category: 'insightCategory',
			author: 'author.name',
			publishedAt: 'publishedAt',
			media: 'heroImage.asset'
		},
		prepare({ title, category, author, publishedAt, media }) {
			const categoryLabel =
				INSIGHT_CATEGORIES.find((c) => c.value === category)?.title ?? category;
			const date = publishedAt ? new Date(publishedAt).toISOString().slice(0, 10) : null;
			const subtitle = [categoryLabel, author, date].filter(Boolean).join(' · ');
			return { title: title || 'Insight', subtitle: subtitle || undefined, media };
		}
	}
});
