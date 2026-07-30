import { defineArrayMember, defineField, defineType } from 'sanity';

/**
 * Insight-specific content blocks. These extend the shared editorial vocabulary the
 * Insights article body reuses from guides (callout, key figures, inline image) with
 * blocks the journal needs: a pull quote, a takeaways box, an FAQ, and an inline CTA.
 * The section wrapper mirrors `guideSection` so the sticky contents rail and anchors
 * work identically across both long-form templates.
 */

/**
 * The framed note in the article hero's right rail, under the image. It carries the
 * article's thesis in a sentence, so the hero states a point of view rather than only a
 * headline — and it gives the rail something to stand on beneath the photograph.
 */
export const insightHeroNote = defineType({
	name: 'insightHeroNote',
	title: 'Hero note',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'A short line, set in Playfair. e.g. "More than a view."',
			validation: (Rule) => Rule.required().max(80)
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 3,
			description: 'One or two sentences. Say the thing the article argues.',
			validation: (Rule) => Rule.required().max(280)
		})
	],
	preview: {
		select: { title: 'heading', subtitle: 'body' }
	}
});

/**
 * A photograph in the body, matted: the 1px frame holds the image AND its caption, the
 * same plate-and-label idiom as the article hero. `mediaAssetMetadata` alone can't carry a
 * caption, which is why this wraps it rather than being used directly.
 */
export const insightFigure = defineType({
	name: 'insightFigure',
	title: 'Figure',
	type: 'object',
	fields: [
		defineField({
			name: 'image',
			title: 'Image',
			type: 'mediaAssetMetadata',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'caption',
			title: 'Caption',
			type: 'string',
			description:
				'Shown inside the frame, under the photograph. Say what it is and where — a plate label, not a sales line.',
			validation: (Rule) => Rule.max(160)
		})
	],
	preview: {
		select: { title: 'caption', subtitle: 'image.altText', media: 'image.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || subtitle || 'Figure', subtitle: title ? subtitle : undefined, media };
		}
	}
});

/** One point in a card grid. */
export const insightCardGridItem = defineType({
	name: 'insightCardGridItem',
	title: 'Point',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			validation: (Rule) => Rule.required().max(60)
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 3,
			validation: (Rule) => Rule.required().max(240)
		})
	],
	preview: { select: { title: 'heading', subtitle: 'body' } }
});

/**
 * Two or three points set side by side, hairline-framed on white. For genuinely PARALLEL
 * considerations that the reader weighs against each other (orientation / privacy /
 * outdoor living) — the grid is what says "these rank equally". If the points are
 * sequential, or if there is really only one, use prose or a list instead. One grid in an
 * article is a beat; a grid in every section is wallpaper.
 */
export const insightCardGrid = defineType({
	name: 'insightCardGrid',
	title: 'Card grid',
	type: 'object',
	fields: [
		defineField({
			name: 'items',
			title: 'Points',
			type: 'array',
			of: [{ type: 'insightCardGridItem' }],
			validation: (Rule) => Rule.required().min(2).max(3)
		})
	],
	preview: {
		select: { a: 'items.0.heading', b: 'items.1.heading', c: 'items.2.heading' },
		prepare({ a, b, c }) {
			return {
				title: [a, b, c].filter(Boolean).join(' · ') || 'Card grid',
				subtitle: 'Card grid'
			};
		}
	}
});

/** A pulled-out editorial quote. Large Playfair, hairline-framed — never a side stripe. */
export const insightPullQuote = defineType({
	name: 'insightPullQuote',
	title: 'Pull quote',
	type: 'object',
	fields: [
		defineField({
			name: 'quote',
			title: 'Quote',
			type: 'text',
			rows: 3,
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'attribution',
			title: 'Attribution',
			type: 'string',
			description: 'Optional source shown beneath the quote, e.g. a name or role.'
		})
	],
	preview: {
		select: { quote: 'quote', attribution: 'attribution' },
		prepare({ quote, attribution }) {
			return { title: quote || 'Pull quote', subtitle: attribution || 'Pull quote' };
		}
	}
});

/**
 * One point inside a takeaways box. The label is a separate field rather than a convention
 * inside the text ("Lifestyle — …"), so the emphasis is guaranteed and the editor can see
 * what's expected. Leave the label blank for a plain, unlabelled point.
 */
export const insightTakeawayItem = defineType({
	name: 'insightTakeawayItem',
	title: 'Takeaway',
	type: 'object',
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			description: 'Optional lead-in, e.g. "Lifestyle". Rendered in green ahead of the text.'
		}),
		defineField({
			name: 'text',
			title: 'Text',
			type: 'string',
			validation: (Rule) => Rule.required()
		})
	],
	preview: {
		select: { label: 'label', text: 'text' },
		prepare({ label, text }) {
			return { title: text, subtitle: label || undefined };
		}
	}
});

/** A boxed "what this covers / key takeaways" summary — a short list of labelled points. */
export const insightTakeaways = defineType({
	name: 'insightTakeaways',
	title: 'Key takeaways',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Optional label, e.g. "What this article covers".'
		}),
		defineField({
			name: 'items',
			title: 'Points',
			type: 'array',
			of: [{ type: 'insightTakeawayItem' }],
			validation: (Rule) => Rule.required().min(1)
		})
	],
	preview: {
		select: { heading: 'heading', items: 'items' },
		prepare({ heading, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: heading || 'Key takeaways',
				subtitle: `${count} ${count === 1 ? 'point' : 'points'}`
			};
		}
	}
});

/** One question/answer pair inside an FAQ block. */
export const insightFaqItem = defineType({
	name: 'insightFaqItem',
	title: 'FAQ item',
	type: 'object',
	fields: [
		defineField({
			name: 'question',
			title: 'Question',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'answer',
			title: 'Answer',
			type: 'text',
			rows: 4,
			description: 'Plain text; blank lines split paragraphs.',
			validation: (Rule) => Rule.required()
		})
	],
	preview: {
		select: { title: 'question', subtitle: 'answer' }
	}
});

/** A frequently-asked-questions accordion. Also emits FAQPage structured data. */
export const insightFaq = defineType({
	name: 'insightFaq',
	title: 'FAQ',
	type: 'object',
	fields: [
		defineField({
			name: 'items',
			title: 'Questions',
			type: 'array',
			of: [{ type: 'insightFaqItem' }],
			validation: (Rule) => Rule.required().min(1)
		})
	],
	preview: {
		select: { items: 'items' },
		prepare({ items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return { title: 'FAQ', subtitle: `${count} ${count === 1 ? 'question' : 'questions'}` };
		}
	}
});

/**
 * One route in a `insightRoutes` decision aid. Unlike a card-grid point, a route is not
 * only a consideration — it is a path the reader can take, so it carries a single next
 * step and a plain statement of what happens once they take it. Both fields are required:
 * a route with no action is a card grid item, and an action with no stated outcome is the
 * kind of CTA that makes a reader hesitate.
 */
export const insightRoute = defineType({
	name: 'insightRoute',
	title: 'Route',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Name the route as something the reader does, e.g. "Assess current opportunities".',
			validation: (Rule) => Rule.required().max(60)
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 3,
			description: 'Who this route suits and what it covers. One or two sentences.',
			validation: (Rule) => Rule.required().max(220)
		}),
		defineField({
			name: 'actionLabel',
			title: 'Action label',
			type: 'string',
			description: 'The single next step, as a verb and object. Keep it short — it sets in a button.',
			validation: (Rule) => Rule.required().max(32)
		}),
		defineField({
			name: 'actionHref',
			title: 'Action link',
			type: 'string',
			description: 'Where the action points, e.g. /contact.',
			validation: (Rule) =>
				Rule.required().custom((value) =>
					typeof value === 'string' && /^(https?:\/\/|\/|mailto:|tel:)/.test(value)
						? true
						: 'Use an absolute path (/contact) or a full URL.'
				)
		}),
		defineField({
			name: 'outcome',
			title: 'What happens next',
			type: 'text',
			rows: 2,
			description:
				'What the reader gets after acting, and when. State only what GHI will actually do.',
			validation: (Rule) => Rule.required().max(200)
		})
	],
	preview: {
		select: { title: 'heading', subtitle: 'actionLabel' }
	}
});

/**
 * A two-route decision aid: the point in an article where the reader stops weighing and
 * picks a path. Exactly two routes, deliberately — a third turns a decision into a menu,
 * and the block's whole job is to make the choice small enough to make. Each route owns
 * its own next step, so the reader never has to work out which of several CTAs applies
 * to them.
 *
 * Use it once, high in the piece, after the reader knows enough to choose. It is not an
 * inline CTA (`insightCtaCallout`, one ask, anywhere) and not a card grid
 * (`insightCardGrid`, parallel considerations with no action).
 */
export const insightRoutes = defineType({
	name: 'insightRoutes',
	title: 'Buyer routes',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Short label above the routes, e.g. "Two routes from here".',
			initialValue: 'Two routes from here',
			validation: (Rule) => Rule.max(60)
		}),
		defineField({
			name: 'routes',
			title: 'Routes',
			type: 'array',
			of: [{ type: 'insightRoute' }],
			validation: (Rule) => Rule.required().length(2)
		})
	],
	preview: {
		select: { heading: 'heading', a: 'routes.0.heading', b: 'routes.1.heading' },
		prepare({ heading, a, b }) {
			return {
				title: [a, b].filter(Boolean).join('  /  ') || 'Buyer routes',
				subtitle: heading || 'Buyer routes'
			};
		}
	}
});

/** An inline enquiry prompt inside the body — distinct from the closing CTA band. */
export const insightCtaCallout = defineType({
	name: 'insightCtaCallout',
	title: 'Inline CTA',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 2
		}),
		defineField({
			name: 'buttonLabel',
			title: 'Button label',
			type: 'string',
			initialValue: 'Speak to GHI',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'buttonHref',
			title: 'Button link',
			type: 'string',
			initialValue: '/contact',
			description: 'Where the button points, e.g. /contact.',
			validation: (Rule) =>
				Rule.required().custom((value) =>
					typeof value === 'string' && /^(https?:\/\/|\/|mailto:|tel:)/.test(value)
						? true
						: 'Use an absolute path (/contact) or a full URL.'
				)
		})
	],
	preview: {
		select: { title: 'heading', subtitle: 'buttonLabel' }
	}
});

/**
 * A live Front Line collection carousel, placed inline in a section body. It carries no
 * listings of its own: the cards are the canonical, published-only frontline feed fetched at
 * request time (the same feed the homepage shows), so withdrawn or unpublished records drop
 * out on their own and nothing is copied into the article. Editors control only the framing —
 * enabling the block is what shows the feed. The carousel already links out to the full
 * collection, so it replaces, rather than sits beside, an `insightCtaCallout` for that action.
 */
export const insightFrontlineRail = defineType({
	name: 'insightFrontlineRail',
	title: 'Front Line carousel',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description:
				'Optional title above the carousel. Leave blank when the section heading already names it — the block renders under the section heading without repeating it.',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'summary',
			title: 'Summary',
			type: 'text',
			rows: 2,
			description: 'Optional line under the heading. Falls back to a count of the live listings.'
		})
	],
	preview: {
		select: { heading: 'heading' },
		prepare({ heading }) {
			return { title: heading || 'Front Line carousel', subtitle: 'Live front-line collection' };
		}
	}
});

/** The rich-text body of an Insights section: prose plus the shared and journal blocks. */
const insightSectionBody = defineField({
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
		// Shared editorial blocks (reused from guides).
		defineArrayMember({ type: 'guideCallout' }),
		defineArrayMember({ type: 'guideKeyFigures' }),
		// Journal-specific blocks. `insightFigure` (not bare `mediaAssetMetadata`) is the image
		// block here: the article needs the framed, captioned plate, and the bare media object
		// has nowhere to put a caption.
		defineArrayMember({ type: 'insightFigure' }),
		defineArrayMember({ type: 'insightCardGrid' }),
		defineArrayMember({ type: 'insightRoutes' }),
		defineArrayMember({ type: 'insightPullQuote' }),
		defineArrayMember({ type: 'insightTakeaways' }),
		defineArrayMember({ type: 'insightFaq' }),
		defineArrayMember({ type: 'insightCtaCallout' }),
		defineArrayMember({ type: 'insightFrontlineRail' })
	],
	validation: (Rule) => Rule.required().min(1)
});

/**
 * One section of an Insights article. The heading drives the contents rail and the URL
 * anchor; the body carries the editorial content. Mirrors `guideSection` so the two
 * templates share the rail, scroll-spy and anchor behaviour.
 */
export const insightSection = defineType({
	name: 'insightSection',
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
			description: 'URL anchor for this section (linked from the contents rail). Auto-filled from the heading.',
			validation: (Rule) => Rule.required()
		}),
		insightSectionBody
	],
	preview: {
		select: { title: 'heading' },
		prepare({ title }) {
			return { title: title || 'Section' };
		}
	}
});
