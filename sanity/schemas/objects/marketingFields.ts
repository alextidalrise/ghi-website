import { defineArrayMember, defineField, defineType } from 'sanity';

const portableTextField = (name: string, title: string, description?: string) =>
	defineField({
		name,
		title,
		type: 'array',
		of: [defineArrayMember({ type: 'block' })],
		description
	});

export const marketingFields = defineType({
	name: 'marketingFields',
	title: 'Marketing source',
	type: 'object',
	description:
		'Campaign and sales source material. Never shown on the public website — use for email, social, ads, CRM, and brochure drafts.',
	fields: [
		portableTextField(
			'marketingDescription',
			'Marketing description',
			'Extended marketing copy for brochures, email bodies, and long-form landing pages. Not the main website description.'
		),
		defineField({
			name: 'keyHooks',
			title: 'Key hooks',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Short bullet hooks for ads, social captions, and email subject lines.'
		}),
		defineField({
			name: 'instagramPost',
			title: 'Instagram post',
			type: 'instagramPost'
		})
	],
	preview: {
		select: { hooks: 'keyHooks', postImages: 'instagramPost.images' },
		prepare({ hooks, postImages }) {
			const hookCount = Array.isArray(hooks) ? hooks.length : 0;
			const imageCount = Array.isArray(postImages) ? postImages.length : 0;
			const subtitle = [
				hookCount > 0 ? `${hookCount} key hook(s)` : 'No hooks yet',
				imageCount > 0 ? `${imageCount} Instagram image(s)` : null
			]
				.filter(Boolean)
				.join(' · ');
			return {
				title: 'Marketing source',
				subtitle
			};
		}
	}
});
