import { defineArrayMember, defineField, defineType } from 'sanity';

const portableTextField = (name: string, title: string, description?: string) =>
	defineField({
		name,
		title,
		type: 'array',
		of: [defineArrayMember({ type: 'block' })],
		description
	});

export const marketingChannelNotes = defineType({
	name: 'marketingChannelNotes',
	title: 'Channel notes',
	type: 'object',
	fields: [
		defineField({
			name: 'email',
			title: 'Email',
			type: 'text',
			rows: 3,
			description: 'Notes or draft angles for email campaigns.'
		}),
		defineField({
			name: 'social',
			title: 'Social',
			type: 'text',
			rows: 3,
			description: 'Notes for Instagram, Facebook, and other social posts.'
		}),
		defineField({
			name: 'paidAds',
			title: 'Paid ads',
			type: 'text',
			rows: 3,
			description: 'Notes for paid search and display campaigns.'
		}),
		defineField({
			name: 'crm',
			title: 'CRM / WhatsApp',
			type: 'text',
			rows: 3,
			description: 'Snippets or talking points for CRM and agent outreach.'
		}),
		defineField({
			name: 'brochure',
			title: 'Brochure / export',
			type: 'text',
			rows: 3,
			description: 'Notes for brochure, print, or export copy.'
		})
	]
});

export const marketingFields = defineType({
	name: 'marketingFields',
	title: 'Marketing source',
	type: 'object',
	description:
		'Campaign and sales source material. Never shown on the public website — use for email, social, ads, CRM, and brochure drafts.',
	fields: [
		portableTextField(
			'longFormDescription',
			'Long-form description',
			'Extended marketing copy for brochures, email bodies, and long-form landing pages. Not the main website description.'
		),
		portableTextField(
			'lifestyleAngle',
			'Lifestyle angle',
			'Emotional positioning and lifestyle hooks (e.g. privacy, outdoor living, golf access). Useful for social and campaign intros.'
		),
		portableTextField(
			'investmentAngle',
			'Investment angle',
			'Investment, rental, or resale positioning. Only include if claims are source-supported and approved — leave blank if unsure.'
		),
		defineField({
			name: 'keyHooks',
			title: 'Key hooks',
			type: 'array',
			of: [{ type: 'string' }],
			description: 'Short bullet hooks for ads, social captions, and email subject lines.'
		}),
		defineField({
			name: 'audienceFit',
			title: 'Audience fit',
			type: 'text',
			rows: 3,
			description:
				'Who this property suits (e.g. family buyer, golfer, relocation, lock-up-and-leave, investor). For marketing and sales handover.'
		}),
		defineField({
			name: 'channelNotes',
			title: 'Channel notes',
			type: 'marketingChannelNotes',
			description: 'Optional per-channel scratchpad for campaign-specific copy.'
		})
	],
	preview: {
		select: { audienceFit: 'audienceFit', hooks: 'keyHooks' },
		prepare({ audienceFit, hooks }) {
			const hookCount = Array.isArray(hooks) ? hooks.length : 0;
			return {
				title: audienceFit || 'Marketing source',
				subtitle: hookCount > 0 ? `${hookCount} key hook(s)` : 'No hooks yet'
			};
		}
	}
});
