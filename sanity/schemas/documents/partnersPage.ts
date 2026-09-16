import { defineField, defineType } from 'sanity';

/**
 * Editorial copy for /partners.
 *
 * Every other major page already had a singleton (guidesHubPage, aboutPage, contactPage);
 * /partners did not, so its hero, its "why we work with partners" section and its SEO
 * description were literal strings in `web/src/routes/partners/+page.svelte`. That meant
 * every market launch needed a Svelte edit, which is exactly why the page still said
 * "across Spain and Portugal" two markets later.
 *
 * The partner directory itself is NOT authored here — it is a live query over `partner`
 * and `partnerCategory`, filtered by the visitor's chosen market. This document holds only
 * the surrounding words.
 */
export const partnersPage = defineType({
	name: 'partnersPage',
	title: 'Partners page',
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
			group: 'content',
			description:
				'The standfirst under the page title. Avoid naming individual countries — the coverage filter below it lists them from the live data, so a named pair goes stale the moment a market is added.'
		}),
		defineField({
			name: 'heroMarkers',
			title: 'Hero markers',
			type: 'array',
			of: [{ type: 'string' }],
			group: 'content',
			description:
				'The short dot-separated assurances under the lead, e.g. "Independently verified". Three reads best.',
			validation: (Rule) => Rule.max(4)
		}),
		defineField({
			name: 'whyHeading',
			title: 'Why heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'whyBody',
			title: 'Why body',
			type: 'text',
			rows: 6,
			group: 'content'
		}),
		defineField({
			name: 'whyAttributes',
			title: 'Why attributes',
			type: 'array',
			of: [{ type: 'string' }],
			group: 'content',
			description: 'The tracked uppercase list closing the "why" section, e.g. "Independent".',
			validation: (Rule) => Rule.max(6)
		}),
		defineField({
			name: 'becomeHeading',
			title: '"Become a partner" heading',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'becomeBody',
			title: '"Become a partner" body',
			type: 'text',
			rows: 3,
			group: 'content'
		}),
		defineField({
			name: 'becomeCta',
			title: '"Become a partner" button label',
			type: 'string',
			group: 'content'
		}),
		defineField({
			name: 'becomeSupport',
			title: '"Become a partner" support note',
			type: 'text',
			rows: 2,
			group: 'content',
			description: 'The fine print beneath the button.'
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
			return { title: 'Partners page' };
		}
	}
});
