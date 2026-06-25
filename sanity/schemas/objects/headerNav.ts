import { defineField, defineType } from 'sanity';

/** The shape of a navLink value, used by the cross-field validation below. */
type NavLinkValue = {
	linkType?: 'reference' | 'internal' | 'external';
	reference?: { _ref?: string };
	internalPath?: string;
	externalUrl?: string;
};

const LINK_TYPES = [
	{ title: 'Page on this site', value: 'reference' },
	{ title: 'Internal path', value: 'internal' },
	{ title: 'External URL', value: 'external' }
] as const;

function linkTypeLabel(linkType?: string): string | undefined {
	if (linkType === 'reference') return 'Linked page';
	if (linkType === 'internal') return 'Internal path';
	if (linkType === 'external') return 'External URL';
	return undefined;
}

/**
 * A single navigation destination. The editor picks one of three link styles:
 *  - reference: a country / location / community / guide doc. The URL is resolved from
 *    its slug at query time, so it stays correct if the slug later changes.
 *  - internal:  a hand-typed path on this site (e.g. /about, /contact).
 *  - external:  a full URL on another site.
 * Left entirely untouched, a navLink resolves to no link — which is valid for a parent
 * menu item that exists only to open its dropdown.
 */
export const navLink = defineType({
	name: 'navLink',
	title: 'Link',
	type: 'object',
	fields: [
		defineField({
			name: 'linkType',
			title: 'Link to',
			type: 'string',
			options: { list: [...LINK_TYPES], layout: 'radio' }
		}),
		defineField({
			name: 'reference',
			title: 'Page',
			type: 'reference',
			to: [{ type: 'locationTaxonomy' }, { type: 'guide' }],
			description:
				'Link to a country, location, community, or guide. The URL stays correct if its slug changes.',
			hidden: ({ parent }) => (parent as NavLinkValue)?.linkType !== 'reference'
		}),
		defineField({
			name: 'internalPath',
			title: 'Internal path',
			type: 'string',
			description: 'A path on this site, starting with “/”. For example /about or /front-line-collection.',
			placeholder: '/about',
			hidden: ({ parent }) => (parent as NavLinkValue)?.linkType !== 'internal',
			validation: (Rule) =>
				Rule.custom((value, context) => {
					const linkType = (context.parent as NavLinkValue | undefined)?.linkType;
					if (linkType !== 'internal' || !value) return true;
					return value.startsWith('/') ? true : 'Internal paths must start with “/”.';
				})
		}),
		defineField({
			name: 'externalUrl',
			title: 'External URL',
			type: 'url',
			description: 'A full URL on another site, including https://.',
			hidden: ({ parent }) => (parent as NavLinkValue)?.linkType !== 'external'
		})
	],
	validation: (Rule) =>
		Rule.custom((value: NavLinkValue | undefined) => {
			// No link style chosen — fine; this is how a dropdown-only parent is expressed.
			if (!value || !value.linkType) return true;
			if (value.linkType === 'reference' && !value.reference?._ref) return 'Choose a page to link to.';
			if (value.linkType === 'internal' && !value.internalPath) return 'Enter an internal path.';
			if (value.linkType === 'external' && !value.externalUrl) return 'Enter a URL.';
			return true;
		})
});

/** A second-level menu item — always a real link (no further nesting). */
export const navMenuChild = defineType({
	name: 'navMenuChild',
	title: 'Sub-item',
	type: 'object',
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'link',
			title: 'Link',
			type: 'navLink',
			validation: (Rule) => Rule.required()
		})
	],
	preview: {
		select: { title: 'label', linkType: 'link.linkType' },
		prepare({ title, linkType }) {
			return { title: title || 'Sub-item', subtitle: linkTypeLabel(linkType) };
		}
	}
});

/**
 * A top-level menu item. It can be a plain link, a dropdown of sub-items, or both
 * (a country that links to its own page and lists its locations underneath).
 */
export const navMenuItem = defineType({
	name: 'navMenuItem',
	title: 'Menu item',
	type: 'object',
	fields: [
		defineField({
			name: 'label',
			title: 'Label',
			type: 'string',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'link',
			title: 'Link',
			type: 'navLink',
			description: 'Optional. Leave empty to make this a heading that only opens its dropdown.'
		}),
		defineField({
			name: 'children',
			title: 'Dropdown items',
			type: 'array',
			of: [{ type: 'navMenuChild' }],
			description: 'Optional second level — for example the locations under a country.',
			validation: (Rule) => Rule.max(12)
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => {
			const v = value as { link?: NavLinkValue; children?: unknown[] } | undefined;
			if (!v) return true;
			const hasLink = Boolean(v.link?.linkType);
			const hasChildren = Array.isArray(v.children) && v.children.length > 0;
			if (!hasLink && !hasChildren) return 'Give this item a link, dropdown items, or both.';
			return true;
		}),
	preview: {
		select: { title: 'label', c0: 'children.0.label', c1: 'children.1.label', c2: 'children.2.label' },
		prepare({ title, c0, c1, c2 }) {
			const kids = [c0, c1, c2].filter(Boolean) as string[];
			const subtitle = kids.length ? `▸ ${kids.join(', ')}${kids.length === 3 ? '…' : ''}` : undefined;
			return { title: title || 'Menu item', subtitle };
		}
	}
});
