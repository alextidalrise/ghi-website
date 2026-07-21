import { defineField, defineType } from 'sanity';
import { featuredListingMember, noDuplicateListings } from '../objects/featuredListings';
import { featuredLocationMember, noDuplicateLocations } from '../objects/featuredLocations';

export const siteSettings = defineType({
	name: 'siteSettings',
	title: 'Site settings',
	type: 'document',
	fields: [
		defineField({
			name: 'headerNav',
			title: 'Header navigation',
			type: 'array',
			of: [{ type: 'navMenuItem' }],
			description:
				'The main menu in the site header. Drag to reorder. Each item can carry an optional dropdown of sub-items (for example the locations under a country). Leave this empty to fall back to the built-in default menu.',
			validation: (Rule) => Rule.max(8)
		}),
		defineField({
			name: 'headerCta',
			title: 'Header button',
			type: 'object',
			description: 'The highlighted button at the end of the header (currently “Contact”).',
			fields: [
				defineField({ name: 'label', title: 'Label', type: 'string' }),
				defineField({ name: 'link', title: 'Link', type: 'navLink' })
			],
			validation: (Rule) =>
				Rule.custom((value) => {
					const v = value as { label?: string; link?: { linkType?: string } } | undefined;
					if (!v) return true;
					const hasLabel = Boolean(v.label);
					const hasLink = Boolean(v.link?.linkType);
					if (hasLabel !== hasLink) return 'Give the button both a label and a link, or leave both empty.';
					return true;
				})
		}),
		defineField({
			name: 'footer',
			title: 'Footer',
			type: 'object',
			description:
				'The site footer. Leave any field empty to fall back to its built-in default. Geography columns are curated here rather than generated from the location list.',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'brandStatement',
					title: 'Brand statement',
					type: 'text',
					rows: 2,
					description: 'The short sentence under the logo.',
					validation: (Rule) => Rule.max(200)
				}),
				defineField({
					name: 'inviteLead',
					title: 'Invitation lead',
					type: 'string',
					description: 'The lead line above the footer call-to-action (currently “Considering a move?”).',
					validation: (Rule) => Rule.max(80)
				}),
				defineField({
					name: 'inviteCta',
					title: 'Invitation button',
					type: 'navMenuChild',
					description: 'The call-to-action beside the brand (currently “Make an enquiry” → Contact).'
				}),
				defineField({
					name: 'columns',
					title: 'Index columns',
					type: 'array',
					of: [{ type: 'footerColumn' }],
					description:
						'The link columns — countries with their locations, plus an editorial column like “Explore”. Drag to reorder.',
					validation: (Rule) => Rule.max(6)
				}),
				defineField({
					name: 'legalLinks',
					title: 'Legal links',
					type: 'array',
					of: [{ type: 'navMenuChild' }],
					description: 'The small links in the baseline (currently Privacy, Terms).',
					validation: (Rule) => Rule.max(6)
				}),
				defineField({
					name: 'socialLinks',
					title: 'Social links',
					type: 'array',
					of: [{ type: 'socialLink' }],
					description: 'Social profiles shown in the baseline. Each renders with its platform icon.',
					validation: (Rule) => Rule.max(6)
				})
			]
		}),
		defineField({
			name: 'homepageFeaturedListings',
			title: 'Homepage featured listings',
			type: 'array',
			of: [featuredListingMember],
			description:
				'Hand-picked listings for the homepage featured grid (6–8). Order here is preserved on the site.',
			validation: (Rule) => Rule.max(8).custom(noDuplicateListings)
		}),
		defineField({
			name: 'homepageHero',
			title: 'Homepage hero',
			type: 'object',
			fields: [
				defineField({
					name: 'image',
					title: 'Hero image',
					type: 'mediaAssetMetadata',
					validation: (Rule) => Rule.required()
				}),
				defineField({
					name: 'tagline',
					title: 'Tagline',
					type: 'string',
					description:
						'Optional lead line under the homepage headline. The "Homes beside the fairway" headline stays fixed on the site.'
				})
			]
		}),
		defineField({
			name: 'frontlineHero',
			title: 'Front Line Collection hero',
			type: 'object',
			description:
				'Hero band for the /front-line-collection page. Each field has a sensible default on the site if left empty.',
			fields: [
				defineField({
					name: 'image',
					title: 'Hero image',
					type: 'mediaAssetMetadata',
					description: 'Photograph shown beside the headline (right side on desktop).'
				}),
				defineField({
					name: 'eyebrow',
					title: 'Eyebrow',
					type: 'string',
					description: 'Short label in the gold marker. Defaults to "Frontline Golf".',
					validation: (Rule) => Rule.max(40)
				}),
				defineField({
					name: 'headline',
					title: 'Headline',
					type: 'string',
					description: 'Display headline. Wrap a phrase in *asterisks* to render it in italic.',
					validation: (Rule) => Rule.max(80)
				}),
				defineField({
					name: 'lead',
					title: 'Lead',
					type: 'text',
					rows: 3,
					description: 'Supporting sentence under the headline.',
					validation: (Rule) => Rule.max(280)
				})
			]
		}),
		defineField({
			name: 'homepageFeaturedLocations',
			title: 'Homepage featured locations',
			type: 'array',
			of: [featuredLocationMember],
			description:
				'Hand-picked locations for the homepage featured grid (up to 10). Order here is preserved on the site.',
			validation: (Rule) => Rule.max(10).custom(noDuplicateLocations)
		}),
		defineField({
			name: 'homepageSeo',
			title: 'Homepage SEO',
			type: 'seoFields',
			description: 'SEO metadata for the homepage. Overrides the site-wide defaults.',
			options: { collapsible: true, collapsed: true }
		}),
		defineField({
			name: 'homepageContent',
			title: 'Homepage content',
			type: 'homepageContent',
			description:
				'Editorial copy for the homepage. Each field has a built-in default on the site if left empty.',
			options: { collapsible: true, collapsed: true }
		}),
		defineField({
			name: 'frontlineSeo',
			title: 'Front Line Collection SEO',
			type: 'seoFields',
			description: 'SEO metadata for the /front-line-collection page.',
			options: { collapsible: true, collapsed: true }
		}),
		defineField({
			name: 'frontlineContent',
			title: 'Front Line Collection content',
			type: 'frontlineContent',
			description:
				'Editorial copy for the Front Line Collection page beyond the hero. Each field has a built-in default on the site if left empty.',
			options: { collapsible: true, collapsed: true }
		}),
		defineField({
			name: 'featureFilter',
			title: 'Features filter',
			type: 'object',
			description:
				'Controls the "Features" options in the property search (home + country pages, and the location results filter). Options are built automatically from live listings; these settings keep the list to genuine, useful features. Leave a field empty to use its default.',
			options: { collapsible: true, collapsed: true },
			fields: [
				defineField({
					name: 'minCount',
					title: 'Minimum listings',
					type: 'number',
					description:
						'A feature only appears once at least this many listings mention it. Raise it to hide one-off, listing-specific wording; lower it to surface rarer features. Default: 2.',
					initialValue: 2,
					validation: (Rule) => Rule.min(1).integer()
				}),
				defineField({
					name: 'optionsLimit',
					title: 'Maximum options',
					type: 'number',
					description:
						'The most feature options ever shown (most common first). Default: 40.',
					initialValue: 40,
					validation: (Rule) => Rule.min(1).integer()
				}),
				defineField({
					name: 'blocklist',
					title: 'Always hide',
					type: 'array',
					of: [{ type: 'string' }],
					description:
						'Labels to always keep out of the Features filter, however often they appear — for generic or junk wording that slips in (e.g. "Amenities", "Price range", "Apartments and Penthouses"). Case-insensitive; match the label exactly as it reads on a listing.',
					options: { layout: 'tags' }
				}),
				defineField({
					name: 'allowlist',
					title: 'Always show',
					type: 'array',
					of: [{ type: 'string' }],
					description:
						'Labels to always keep in the Features filter, even if fewer than "Minimum listings" carry them — for a rare but genuine feature you want buyers to be able to filter by. Case-insensitive; the label must still appear on at least one live listing.',
					options: { layout: 'tags' }
				})
			]
		})
	],
	preview: {
		prepare() {
			return { title: 'Site settings' };
		}
	}
});
