import { defineField, defineType } from 'sanity';
import { INSIGHT_CATEGORIES } from '../constants/enums';

/**
 * A closing-CTA action (label + link) is all-or-nothing: a button with no link, or a
 * link with no label, would render a broken or invisible action. Require both or neither.
 */
const ctaActionRule = (value: { label?: string; href?: string } | undefined) => {
	if (!value) return true;
	const hasLabel = typeof value.label === 'string' && value.label.trim().length > 0;
	const hasHref = typeof value.href === 'string' && value.href.trim().length > 0;
	if (hasLabel !== hasHref) return 'Set both a label and a link, or leave both empty.';
	return true;
};

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
			name: 'heroLayout',
			title: 'Hero layout',
			type: 'string',
			group: 'content',
			options: {
				list: [
					{ title: 'Standard — leading rail plate', value: 'standard' },
					{ title: 'Split — equal columns, square plate', value: 'splitSquare' }
				],
				layout: 'radio'
			},
			initialValue: 'standard',
			description:
				'Standard is the house hero: a narrow leading plate beside the headline. Split gives the headline and a square photograph equal columns, with the caption overlaid on the image — the launch-article treatment. Leave on Standard unless a piece is designed for the split.',
			validation: (Rule) => Rule.required()
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
			name: 'ctaPrimary',
			title: 'Closing CTA — lead action (override)',
			type: 'object',
			group: 'content',
			description:
				'Optional. Replaces the gold lead button on the closing band (default: "Get in touch"). Use it to close on the route the article actually argues for — e.g. "Register for Nobu updates" → /contact?enquiry=nobu-monte-rei-updates.',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'label',
					title: 'Button label',
					type: 'string',
					validation: (Rule) => Rule.max(40)
				}),
				defineField({
					name: 'href',
					title: 'Link',
					type: 'string',
					description: 'Internal path (e.g. /contact?enquiry=nobu-monte-rei-updates) or a full URL.'
				})
			],
			validation: (Rule) => Rule.custom(ctaActionRule)
		}),
		defineField({
			name: 'ctaSecondary',
			title: 'Closing CTA — alternative action (override)',
			type: 'object',
			group: 'content',
			description:
				'Optional. Replaces the outline "not ready to enquire" button on the closing band (default: "Browse properties").',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'label',
					title: 'Button label',
					type: 'string',
					validation: (Rule) => Rule.max(40)
				}),
				defineField({
					name: 'href',
					title: 'Link',
					type: 'string',
					description: 'Internal path or a full URL.'
				})
			],
			validation: (Rule) => Rule.custom(ctaActionRule)
		}),
		defineField({
			name: 'ctaShowSecondary',
			title: 'Closing CTA — show the alternative button',
			type: 'boolean',
			group: 'content',
			initialValue: true,
			description:
				'On by default: the closing band shows an alternative "not ready to enquire" button (the override above, or the "Browse properties" default). Turn OFF to close on the lead action and WhatsApp alone — no third button. This is distinct from leaving the override blank, which keeps the default button.'
		}),
		defineField({
			name: 'ctaWhatsAppLabel',
			title: 'Closing CTA — WhatsApp button label (override)',
			type: 'string',
			group: 'content',
			description:
				'Optional. Replaces the WhatsApp button label on the closing band (default: "WhatsApp"). e.g. "WhatsApp our Portugal team".',
			validation: (Rule) => Rule.max(40)
		}),
		defineField({
			name: 'ctaWhatsAppMessage',
			title: 'Closing CTA — WhatsApp prefilled message (override)',
			type: 'text',
			rows: 2,
			group: 'content',
			description:
				'Optional. The message text pre-filled in WhatsApp — text only, never a number or link (the number stays centralised). Leave blank for the house message.',
			validation: (Rule) => Rule.max(280)
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
