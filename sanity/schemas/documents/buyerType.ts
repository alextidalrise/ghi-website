import { defineField, defineType } from 'sanity';

/**
 * Who a guide is written for — "UK buyer", "International buyer".
 *
 * The Guides hub asks two questions: who are you buying as, and where are you looking.
 * Markets already come from the country documents; this is the other half. It is a
 * document rather than a code list for the same reason countries became one: a new kind
 * of buyer (US, Irish, resident) should be a Studio edit, not a deploy.
 *
 * Buyer types with no guide still appear as a choice on the hub, where the answer says
 * plainly that nothing is written for them yet — so only create one you intend to write
 * for.
 */
export const buyerType = defineType({
	name: 'buyerType',
	title: 'Buyer type',
	type: 'document',
	fields: [
		defineField({
			name: 'name',
			title: 'Name',
			type: 'string',
			description:
				'How the choice reads on the Guides hub, answering "Who are you buying as?" — e.g. "UK buyer". Singular, sentence case.',
			validation: (Rule) => Rule.required().max(40)
		}),
		defineField({
			name: 'slug',
			title: 'Slug',
			type: 'slug',
			description:
				'Used in the Guides hub link (/guides?for=uk-buyer). Keep stable once published — shared links depend on it.',
			options: { source: 'name', maxLength: 48 },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'order',
			title: 'Order',
			type: 'number',
			description: 'Position among the choices on the Guides hub. Lower numbers come first.',
			validation: (Rule) => Rule.min(0).integer()
		})
	],
	orderings: [{ name: 'order', title: 'Order', by: [{ field: 'order', direction: 'asc' }] }],
	preview: {
		select: { title: 'name', slug: 'slug.current' },
		prepare({ title, slug }) {
			return { title: title || 'Buyer type', subtitle: slug ? `?for=${slug}` : undefined };
		}
	}
});
