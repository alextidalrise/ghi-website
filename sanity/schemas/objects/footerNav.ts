import { defineField, defineType } from 'sanity';

/**
 * Footer building blocks. The footer is authored the same way as the header menu: link
 * destinations reuse the shared `navLink` (reference / internal path / external URL), and
 * a labelled link is a `navMenuChild` — so an editor learns one link control for both.
 *
 * A `footerColumn` is one index column (a country with its locations, or an editorial
 * set like "Explore"). Unlike the header, footer geography is curated here rather than
 * generated from the taxonomy, so the order and the exact set are under editorial control.
 */
export const footerColumn = defineType({
	name: 'footerColumn',
	title: 'Footer column',
	type: 'object',
	fields: [
		defineField({
			name: 'heading',
			title: 'Heading',
			type: 'string',
			description: 'Column title — for example a country name ("Spain") or "Explore".',
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'links',
			title: 'Links',
			type: 'array',
			of: [{ type: 'navMenuChild' }],
			description: 'The links listed under this heading. Drag to reorder.',
			validation: (Rule) => Rule.max(12)
		}),
		defineField({
			name: 'highlightLink',
			title: 'Highlighted link',
			type: 'navMenuChild',
			description:
				'Optional emphasised link shown at the foot of the column with an arrow — for example "All Spain →".'
		})
	],
	validation: (Rule) =>
		Rule.custom((value) => {
			const v = value as
				| { links?: unknown[]; highlightLink?: { label?: string } }
				| undefined;
			if (!v) return true;
			const hasLinks = Array.isArray(v.links) && v.links.length > 0;
			const hasHighlight = Boolean(v.highlightLink?.label);
			if (!hasLinks && !hasHighlight) return 'Add at least one link to this column.';
			return true;
		}),
	preview: {
		select: { title: 'heading', l0: 'links.0.label', l1: 'links.1.label', l2: 'links.2.label' },
		prepare({ title, l0, l1, l2 }) {
			const kids = [l0, l1, l2].filter(Boolean) as string[];
			const subtitle = kids.length ? `${kids.join(', ')}${kids.length === 3 ? '…' : ''}` : undefined;
			return { title: title || 'Footer column', subtitle };
		}
	}
});

const SOCIAL_PLATFORMS = [
	{ title: 'Instagram', value: 'instagram' },
	{ title: 'Facebook', value: 'facebook' },
	{ title: 'LinkedIn', value: 'linkedin' },
	{ title: 'YouTube', value: 'youtube' },
	{ title: 'X (Twitter)', value: 'x' }
] as const;

/** One social profile: a known platform (for its icon) and the full profile URL. */
export const socialLink = defineType({
	name: 'socialLink',
	title: 'Social link',
	type: 'object',
	fields: [
		defineField({
			name: 'platform',
			title: 'Platform',
			type: 'string',
			options: { list: [...SOCIAL_PLATFORMS] },
			validation: (Rule) => Rule.required()
		}),
		defineField({
			name: 'url',
			title: 'Profile URL',
			type: 'url',
			description: 'The full URL of the profile, including https://.',
			validation: (Rule) => Rule.required()
		})
	],
	preview: {
		select: { platform: 'platform', url: 'url' },
		prepare({ platform, url }) {
			const label = SOCIAL_PLATFORMS.find((p) => p.value === platform)?.title;
			return { title: label || 'Social link', subtitle: url };
		}
	}
});
