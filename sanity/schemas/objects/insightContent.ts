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

/**
 * One column of an `insightFigurePair`: a framed photograph, its caption, and an optional
 * link out to the property it shows. Same fields as a standalone `insightFigure`, plus the
 * property link — so the two columns each stay self-contained (image + caption + label
 * travel together) rather than being reconstructed from adjacent blocks.
 */
export const insightFigurePairItem = defineType({
	name: 'insightFigurePairItem',
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
		}),
		defineField({
			name: 'linkLabel',
			title: 'Property link label',
			type: 'string',
			description:
				'Optional link shown beneath the caption, e.g. "View Las Villas Sotogrande on Golf Homes International". Needs a destination to appear.',
			validation: (Rule) => Rule.max(120)
		}),
		defineField({
			name: 'linkHref',
			title: 'Property link destination',
			type: 'string',
			description: 'Where the label points, e.g. a property page URL.',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { linkLabel?: string } | undefined;
					const label = parent?.linkLabel?.trim();
					const href = value?.trim();
					if (!label && !href) return true;
					if (label && !href) return 'Add a destination, or remove the link label.';
					if (href && !label) return 'Add a link label, or remove the destination.';
					return /^(https?:\/\/|\/|mailto:|tel:)/.test(href!)
						? true
						: 'Use an absolute path (/spain/...) or a full URL.';
				})
		})
	],
	preview: {
		select: { title: 'caption', subtitle: 'image.altText', media: 'image.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || subtitle || 'Figure', subtitle: title ? subtitle : undefined, media };
		}
	}
});

/**
 * Two figures set side by side as an equal pair — a deliberate, content-specific module,
 * NOT an automatic pairing of adjacent `insightFigure` blocks. Use it when two places or
 * properties are meant to be read against each other (a Spain / Portugal comparison), so the
 * layout itself says "weigh these two". Exactly two, because a pair is the comparison; a third
 * turns it into a gallery. Each column carries its own caption and optional property link.
 *
 * On desktop/tablet-landscape the two share a row at equal width and a shared crop ratio (so
 * neither image is distorted); on mobile they stack in source order. For a single image use
 * `insightFigure`; for a run of images use several figures.
 */
export const insightFigurePair = defineType({
	name: 'insightFigurePair',
	title: 'Figure pair',
	type: 'object',
	fields: [
		defineField({
			name: 'items',
			title: 'Figures',
			type: 'array',
			of: [{ type: 'insightFigurePairItem' }],
			description: 'Exactly two figures, shown side by side on desktop and stacked on mobile.',
			validation: (Rule) => Rule.required().length(2)
		})
	],
	preview: {
		select: { a: 'items.0.caption', b: 'items.1.caption', media: 'items.0.image.asset' },
		prepare({ a, b, media }) {
			return {
				title: [a, b].filter(Boolean).join('  /  ') || 'Figure pair',
				subtitle: 'Figure pair',
				media
			};
		}
	}
});

/**
 * A compact, article-specific editorial portrait: a small square photograph that sits
 * beside the prose that introduces the person, with an optional name-and-role label.
 *
 * Distinct from `insightFigure` on purpose. A figure is the article's own full-width,
 * 16:9 plate — the right treatment for a place or a property, the wrong one for a face
 * (it crops a square portrait hard and gives it the visual weight of a hero). This block
 * keeps the image's square ratio, renders it small, and floats it alongside a paragraph
 * so it reads as a personal-service element rather than a feature. It is also NOT the
 * global `author.avatar`, which belongs to the byline: the portrait can name whoever the
 * copy introduces without touching the article's author record.
 */
export const insightPortrait = defineType({
	name: 'insightPortrait',
	title: 'Compact portrait',
	type: 'object',
	fields: [
		defineField({
			name: 'image',
			title: 'Image',
			type: 'mediaAssetMetadata',
			description: 'A square, head-and-shoulders portrait works best — it renders small and uncropped.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			description: 'Optional. Shown beneath the portrait, e.g. "James Pryor".',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'role',
			title: 'Role',
			type: 'string',
			description: 'Optional. Shown after the name, e.g. "Managing Director". Needs a name to appear.',
			validation: (Rule) => Rule.max(80)
		})
	],
	preview: {
		select: { name: 'name', role: 'role', altText: 'image.altText', media: 'image.asset' },
		prepare({ name, role, altText, media }) {
			const label = [name, role].filter(Boolean).join(' · ');
			return { title: label || altText || 'Portrait', subtitle: 'Compact portrait', media };
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
 * A Front Line collection carousel, placed inline in a section body. The listings are
 * hand-picked here — an ordered set of property or development references the marketing team
 * curates per article — and dereferenced at request time through the public listing gates, so
 * withdrawn or unpublished picks drop out on their own and nothing is copied into the article.
 * (Editor order is preserved.) The carousel links out to the full collection, so it replaces,
 * rather than sits beside, an `insightCtaCallout` for that action.
 */
export const insightFrontlineRail = defineType({
	name: 'insightFrontlineRail',
	title: 'Front Line carousel',
	type: 'object',
	fieldsets: [
		{
			name: 'autoSummary',
			title: 'Auto-summary (when Summary is blank)',
			description:
				'The line shown under the heading when Summary is left empty. Use {count} for the live number of listings.',
			options: { collapsible: true, collapsed: true }
		},
		{
			name: 'viewAll',
			title: 'View-all link',
			description: 'The link beneath the carousel. Turn it off, or point it wherever you like.',
			options: { collapsible: true, collapsed: false }
		}
	],
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
			description:
				'Optional line under the heading, shown verbatim. Leave blank to use the auto-summary below.'
		}),
		defineField({
			name: 'summaryCountSingular',
			title: 'Auto-summary (one listing)',
			type: 'string',
			fieldset: 'autoSummary',
			initialValue: '1 property on the golf course',
			description: 'Shown when exactly one listing is live. {count} is replaced with 1.',
			validation: (Rule) => Rule.max(120)
		}),
		defineField({
			name: 'summaryCountPlural',
			title: 'Auto-summary (multiple listings)',
			type: 'string',
			fieldset: 'autoSummary',
			initialValue: '{count} properties on the golf course',
			description: 'Shown when two or more listings are live. Use {count} for the number.',
			validation: (Rule) => Rule.max(120)
		}),
		defineField({
			name: 'listings',
			title: 'Listings',
			type: 'array',
			of: [
				defineArrayMember({
					type: 'reference',
					to: [{ type: 'propertyListing' }, { type: 'development' }]
				})
			],
			description:
				'Hand-pick the properties or developments to feature, in the order they should appear. Withdrawn or unpublished listings drop out automatically.',
			validation: (Rule) => Rule.required().min(1).max(12)
		}),
		defineField({
			name: 'showViewAll',
			title: 'Show the link',
			type: 'boolean',
			fieldset: 'viewAll',
			initialValue: true,
			description: 'Show a link out beneath the carousel. Off hides it entirely.'
		}),
		defineField({
			name: 'viewAllLabel',
			title: 'Link text',
			type: 'string',
			fieldset: 'viewAll',
			initialValue: 'View all frontline',
			// Only relevant when the link is shown; collapse it away otherwise. `!== false` so the
			// field stays visible for older blocks that predate the toggle (undefined ⇒ shown).
			hidden: ({ parent }) => parent?.showViewAll === false,
			validation: (Rule) =>
				Rule.max(40).custom((value, context) => {
					const parent = context.parent as { showViewAll?: boolean } | undefined;
					if (parent?.showViewAll === false) return true;
					return value?.trim() ? true : 'Add link text, or turn the link off.';
				})
		}),
		defineField({
			name: 'viewAllHref',
			title: 'Link destination',
			type: 'string',
			fieldset: 'viewAll',
			initialValue: '/front-line-collection',
			description: 'Where the link points, e.g. /front-line-collection or a full URL.',
			hidden: ({ parent }) => parent?.showViewAll === false,
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const parent = context.parent as { showViewAll?: boolean } | undefined;
					if (parent?.showViewAll === false) return true;
					const trimmed = value?.trim();
					if (!trimmed) return 'Add a destination, or turn the link off.';
					return /^(https?:\/\/|\/|mailto:|tel:)/.test(trimmed)
						? true
						: 'Use an absolute path (/front-line-collection) or a full URL.';
				})
		})
	],
	preview: {
		select: { heading: 'heading', listings: 'listings' },
		prepare({ heading, listings }) {
			const count = Array.isArray(listings) ? listings.length : 0;
			return {
				title: heading || 'Front Line carousel',
				subtitle: `${count} hand-picked ${count === 1 ? 'listing' : 'listings'}`
			};
		}
	}
});

/**
 * One destination panel: a place the article profiles. It bundles a canonical location — which
 * owns the name, hub route and default photograph — with the article's own selling paragraph, an
 * optional article-only image and overlay caption, and a contextual CTA. Identity is dereferenced
 * live at render time, so it can never drift from the location record; only the editorial framing
 * and any article-specific image live in the Insight.
 */
export const insightDestinationCard = defineType({
	name: 'insightDestinationCard',
	title: 'Destination',
	type: 'object',
	fields: [
		defineField({
			name: 'location',
			title: 'Location',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }],
			options: { filter: 'type == "location"' },
			description:
				'The place this panel profiles. Its name, hub URL and default photograph come from this record — pick a location, not a country or community.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'body',
			title: 'Body',
			type: 'text',
			rows: 4,
			description: "The article's selling paragraph for this destination.",
			validation: (Rule) => Rule.required().max(600)
		}),
		defineField({
			name: 'imageOverride',
			title: 'Article image (override)',
			type: 'mediaAssetMetadata',
			description:
				"Optional. A photograph used for this article only. Leave blank to use the location's own hero image. This never changes the location record or cards elsewhere on the site."
		}),
		defineField({
			name: 'caption',
			title: 'Image caption',
			type: 'string',
			description: 'Optional. Shown in a small green tab overlaid on the image.',
			validation: (Rule) => Rule.max(120)
		}),
		defineField({
			name: 'actionLabel',
			title: 'CTA label (override)',
			type: 'string',
			description: 'Optional. Defaults to “See {location} properties”.',
			validation: (Rule) => Rule.max(48)
		}),
		defineField({
			name: 'actionHrefOverride',
			title: 'CTA link (override)',
			type: 'string',
			description:
				'Optional. Only needed when the canonical location hub URL cannot be used. Absolute path (/portugal/...) or a full URL.',
			validation: (Rule) =>
				Rule.custom((value) => {
					if (!value) return true;
					return /^(https?:\/\/|\/)/.test(value)
						? true
						: 'Use an absolute path (/portugal/...) or a full URL.';
				})
		})
	],
	preview: {
		select: { title: 'location.name', subtitle: 'caption', media: 'imageOverride.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || 'Destination', subtitle: subtitle || 'Destination panel', media };
		}
	}
});

/**
 * An ordered set of destination panels — the "four settings" module. Each item is a complete
 * unit (place identity + article copy + image + CTA); the grid just holds the order and count.
 * Two to six, because it is a curated tour of places, not a listing grid.
 */
export const insightDestinationGrid = defineType({
	name: 'insightDestinationGrid',
	title: 'Destination panels',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Optional. Leave blank when the section heading already names the module.',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'items',
			title: 'Destinations',
			type: 'array',
			of: [{ type: 'insightDestinationCard' }],
			description: 'Two to six destination panels, in reading order.',
			validation: (Rule) => Rule.required().min(2).max(6)
		})
	],
	preview: {
		select: { a: 'items.0.location.name', b: 'items.1.location.name', items: 'items' },
		prepare({ a, b, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: [a, b].filter(Boolean).join(', ') || 'Destination panels',
				subtitle: `${count} ${count === 1 ? 'destination' : 'destinations'}`
			};
		}
	}
});

/**
 * One development in the collection: a live reference to a canonical `development` record, plus an
 * optional article-only image and alt, and an optional grouping label override. Title, route, price,
 * status and completion are ALL read from the referenced record at render time — never copied here —
 * so the collection can never show a stale price or a dead link.
 */
export const insightDevelopmentGridItem = defineType({
	name: 'insightDevelopmentGridItem',
	title: 'Development',
	type: 'object',
	fields: [
		defineField({
			name: 'development',
			title: 'Development',
			type: 'reference',
			to: [{ type: 'development' }],
			description:
				'The development to feature. Its title, URL, price, status and completion are read live — withdrawn or unpublished picks drop out on their own.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'imageOverride',
			title: 'Article image (override)',
			type: 'mediaAssetMetadata',
			description:
				"Optional. A photograph for this article's card only. Leave blank to use the development's own approved image. Never changes the development record or its cards elsewhere."
		}),
		defineField({
			name: 'altOverride',
			title: 'Article image alt (override)',
			type: 'string',
			description: 'Optional. Alt text for the override image. Defaults to the development title.',
			validation: (Rule) => Rule.max(160)
		}),
		defineField({
			name: 'groupLabelOverride',
			title: 'Group label (override)',
			type: 'string',
			description:
				'Optional. The destination heading this card groups under on mobile. Defaults to the development’s location.',
			validation: (Rule) => Rule.max(60)
		})
	],
	preview: {
		select: { title: 'development.title', subtitle: 'groupLabelOverride', media: 'imageOverride.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || 'Development', subtitle: subtitle || 'Development card', media };
		}
	}
});

/**
 * An ordered, mobile-groupable collection of current developments with live commercial facts. The
 * desktop layout is a flat two-column grid in editor order; on a narrow screen the cards group under
 * their destination and collapse to one representative each behind a "See all" disclosure.
 */
export const insightDevelopmentGrid = defineType({
	name: 'insightDevelopmentGrid',
	title: 'Development collection',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Optional. Leave blank when the section heading already names the module.',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'items',
			title: 'Developments',
			type: 'array',
			of: [{ type: 'insightDevelopmentGridItem' }],
			description: 'The developments, in the desktop reading order.',
			validation: (Rule) => Rule.required().min(1).max(12)
		}),
		defineField({
			name: 'mobileInitialMode',
			title: 'Mobile — initially show',
			type: 'string',
			options: {
				list: [
					{ title: 'One per destination', value: 'onePerGroup' },
					{ title: 'All developments', value: 'all' }
				],
				layout: 'radio'
			},
			initialValue: 'onePerGroup',
			description:
				'On narrow screens, whether to show one representative per destination behind a disclosure, or all cards outright.'
		}),
		defineField({
			name: 'expandLabel',
			title: 'Mobile — expand button label',
			type: 'string',
			initialValue: 'See all {count} developments',
			description: 'Shown when collapsed on mobile. Use {count} for the live number of developments.',
			validation: (Rule) => Rule.max(48)
		}),
		defineField({
			name: 'collapseLabel',
			title: 'Mobile — collapse button label',
			type: 'string',
			initialValue: 'Show fewer developments',
			validation: (Rule) => Rule.max(48)
		})
	],
	preview: {
		select: { heading: 'heading', items: 'items' },
		prepare({ heading, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: heading || 'Development collection',
				subtitle: `${count} ${count === 1 ? 'development' : 'developments'}`
			};
		}
	}
});

/**
 * One course in the collection: a live reference to a canonical `golfCourse` record, plus an
 * optional article-only image and alt, and an optional CTA label override. Name, route and
 * destination are ALL read from the referenced record at render time — never copied here — so a
 * card can never show a dead link or a renamed course.
 */
export const insightCourseGridItem = defineType({
	name: 'insightCourseGridItem',
	title: 'Course',
	type: 'object',
	fields: [
		defineField({
			name: 'golfCourse',
			title: 'Golf course',
			type: 'reference',
			to: [{ type: 'golfCourse' }],
			description:
				'The course to feature. Its name, URL and destination are read live — an unpublished course drops out on its own.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'imageOverride',
			title: 'Article image (override)',
			type: 'mediaAssetMetadata',
			description:
				"Optional. A photograph for this article's card only. Leave blank to use the course's own first image. Never changes the course record."
		}),
		defineField({
			name: 'altOverride',
			title: 'Article image alt (override)',
			type: 'string',
			description: 'Optional. Alt text for the override image. Defaults to the course name.',
			validation: (Rule) => Rule.max(160)
		}),
		defineField({
			name: 'actionLabel',
			title: 'CTA label (override)',
			type: 'string',
			description: 'Optional. Defaults to “View course”.',
			validation: (Rule) => Rule.max(48)
		})
	],
	preview: {
		select: { title: 'golfCourse.name', subtitle: 'golfCourse.community.name', media: 'imageOverride.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || 'Course', subtitle: subtitle || 'Golf course', media };
		}
	}
});

/**
 * An ordered collection of golf courses with live identity and routes. Two to six sit best in the
 * two-column matrix; each card is a whole-surface link to the canonical course page.
 */
export const insightCourseGrid = defineType({
	name: 'insightCourseGrid',
	title: 'Course collection',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Optional. Leave blank when the section heading already names the module.',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'items',
			title: 'Courses',
			type: 'array',
			of: [{ type: 'insightCourseGridItem' }],
			description: 'The courses, in reading order.',
			validation: (Rule) => Rule.required().min(1).max(8)
		})
	],
	preview: {
		select: { heading: 'heading', a: 'items.0.golfCourse.name', b: 'items.1.golfCourse.name', items: 'items' },
		prepare({ heading, a, b, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: heading || [a, b].filter(Boolean).join(', ') || 'Course collection',
				subtitle: `${count} ${count === 1 ? 'course' : 'courses'}`
			};
		}
	}
});

/**
 * One partner cell: a live reference to a canonical `partner` record and an optional article
 * service label. The name and logo are read from the record; the buyer-facing link always routes
 * to the vetted-partner index — the partner's own `referralUrl` is the GHI team's internal handoff
 * and is never projected to the browser.
 */
export const insightPartnerLogoItem = defineType({
	name: 'insightPartnerLogoItem',
	title: 'Partner',
	type: 'object',
	fields: [
		defineField({
			name: 'partner',
			title: 'Partner',
			type: 'reference',
			to: [{ type: 'partner' }],
			description:
				'The partner to feature. Its name and logo are read live — a partner with no logo, or one that is unpublished, drops out on its own.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'serviceLabel',
			title: 'Service label (override)',
			type: 'string',
			description: 'Optional. A short label under the logo, e.g. “Currency”. Defaults to the partner’s category.',
			validation: (Rule) => Rule.max(40)
		})
	],
	preview: {
		select: { title: 'partner.name', subtitle: 'serviceLabel', media: 'partner.logo.asset' },
		prepare({ title, subtitle, media }) {
			return { title: title || 'Partner', subtitle: subtitle || 'Partner', media };
		}
	}
});

/**
 * A ruled matrix of partner logos — the "who we work with" wall for a launch article. Names and
 * logos are dereferenced live; every cell links to the vetted-partner index, so the introduction
 * always runs through GHI. Cells whose partner has no logo drop out on their own.
 */
export const insightPartnerLogoGrid = defineType({
	name: 'insightPartnerLogoGrid',
	title: 'Partner logos',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Optional. Leave blank when the section heading already names the module.',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'items',
			title: 'Partners',
			type: 'array',
			of: [{ type: 'insightPartnerLogoItem' }],
			description: 'The partners, in reading order.',
			validation: (Rule) => Rule.required().min(2).max(12)
		})
	],
	preview: {
		select: { heading: 'heading', items: 'items' },
		prepare({ heading, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: heading || 'Partner logos',
				subtitle: `${count} ${count === 1 ? 'partner' : 'partners'}`
			};
		}
	}
});

/**
 * One guide card: a live reference to a canonical `guide` record and an optional summary override.
 * Title, audience and route are read from the record; only the article's optional replacement
 * summary lives here.
 */
export const insightGuideCardItem = defineType({
	name: 'insightGuideCardItem',
	title: 'Guide',
	type: 'object',
	fields: [
		defineField({
			name: 'guide',
			title: 'Guide',
			type: 'reference',
			to: [{ type: 'guide' }],
			description:
				'The guide to feature. Its title, audience label and URL are read live — an unpublished guide drops out on its own.',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'summaryOverride',
			title: 'Summary (override)',
			type: 'text',
			rows: 3,
			description: "Optional. Replaces the guide's own tagline on this card only.",
			validation: (Rule) => Rule.max(200)
		})
	],
	preview: {
		select: { title: 'guide.title', subtitle: 'guide.audienceLabel' },
		prepare({ title, subtitle }) {
			return { title: title || 'Guide', subtitle: subtitle || 'Guide' };
		}
	}
});

/**
 * Exactly two live-text guide cards — the "read next" pair that closes a launch article. Both
 * cards are live references (title/audience/route come from the guide record); the text is real
 * text, never baked into an image. Two, deliberately: a pair points somewhere, a wall is a hub.
 */
export const insightGuideCards = defineType({
	name: 'insightGuideCards',
	title: 'Guide cards',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Optional. Leave blank when the section heading already names the module.',
			validation: (Rule) => Rule.max(80)
		}),
		defineField({
			name: 'items',
			title: 'Guides',
			type: 'array',
			of: [{ type: 'insightGuideCardItem' }],
			description: 'Exactly two guides.',
			validation: (Rule) => Rule.required().length(2)
		})
	],
	preview: {
		select: { a: 'items.0.guide.title', b: 'items.1.guide.title', items: 'items' },
		prepare({ a, b, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: [a, b].filter(Boolean).join('  /  ') || 'Guide cards',
				subtitle: `${count} ${count === 1 ? 'guide' : 'guides'}`
			};
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
				{ title: 'Lead', value: 'lead' },
				{ title: 'Heading', value: 'h3' },
				{ title: 'Subheading', value: 'h4' },
				{ title: 'Quote', value: 'blockquote' },
				{ title: 'Note (fine print)', value: 'note' }
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
		// Two figures read as an equal pair (a place-vs-place comparison). Deliberate and explicit —
		// never an automatic pairing of adjacent single figures.
		defineArrayMember({ type: 'insightFigurePair' }),
		// A compact, square, article-specific portrait — floated beside the prose it belongs to.
		// The figure above is the full-width plate; this is the small personal-service treatment.
		defineArrayMember({ type: 'insightPortrait' }),
		defineArrayMember({ type: 'insightCardGrid' }),
		defineArrayMember({ type: 'insightRoutes' }),
		defineArrayMember({ type: 'insightPullQuote' }),
		defineArrayMember({ type: 'insightTakeaways' }),
		defineArrayMember({ type: 'insightFaq' }),
		defineArrayMember({ type: 'insightCtaCallout' }),
		defineArrayMember({ type: 'insightFrontlineRail' }),
		// Reference-led commercial modules (the launch-article vocabulary). Each dereferences a
		// canonical entity live and never copies its volatile data into the article.
		defineArrayMember({ type: 'insightDestinationGrid' }),
		defineArrayMember({ type: 'insightDevelopmentGrid' }),
		defineArrayMember({ type: 'insightCourseGrid' }),
		defineArrayMember({ type: 'insightPartnerLogoGrid' }),
		defineArrayMember({ type: 'insightGuideCards' })
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
