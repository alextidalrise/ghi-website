import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./fetch', () => ({
	fetchPublic: vi.fn()
}));

import { fetchPublic } from './fetch';
import { fetchHeaderNav, headerNavQuery } from './headerNav';

const mockedFetchPublic = vi.mocked(fetchPublic);

beforeEach(() => {
	mockedFetchPublic.mockReset();
});

describe('headerNavQuery', () => {
	it('projects the third tier and the country stamp fields on second-level entries', () => {
		// The flag and slug are gated to country references so a group that links to a
		// guide or a hand-typed path never picks up a stamp.
		expect(headerNavQuery).toContain(
			'"countrySlug": select(link.reference->type == "country" => link.reference->slug.current)'
		);
		expect(headerNavQuery).toContain(
			'"flag": select(link.reference->type == "country" => link.reference->flag.asset->url)'
		);
		expect(headerNavQuery.match(/coalesce\(children, \[\]\)/g)).toHaveLength(2);
	});
});

describe('fetchHeaderNav', () => {
	it('maps a three-tier menu, stripping campaign params at every tier', async () => {
		mockedFetchPublic.mockResolvedValueOnce({
			items: [
				{
					label: 'Countries',
					href: null,
					external: false,
					children: [
						{
							label: 'Spain',
							href: '/spain?utm_source=menu',
							external: false,
							countrySlug: 'spain',
							flag: 'https://cdn.sanity.io/images/x/y/es.svg',
							children: [
								{ label: 'Marbella', href: '/spain/marbella?utm_campaign=nav', external: false },
								{ label: 'Broken', href: null, external: false }
							]
						},
						// A plain sub-item: no children, no stamp fields.
						{ label: 'Montenegro', href: '/montenegro', external: false }
					]
				}
			],
			cta: { label: 'Contact', href: '/contact', external: false }
		});

		const nav = await fetchHeaderNav();
		expect(nav).toEqual({
			items: [
				{
					label: 'Countries',
					href: null,
					external: false,
					children: [
						{
							label: 'Spain',
							href: '/spain',
							external: false,
							countrySlug: 'spain',
							flag: 'https://cdn.sanity.io/images/x/y/es.svg',
							children: [{ label: 'Marbella', href: '/spain/marbella', external: false }]
						},
						{
							label: 'Montenegro',
							href: '/montenegro',
							external: false,
							countrySlug: null,
							flag: null,
							children: []
						}
					]
				}
			],
			cta: { label: 'Contact', href: '/contact', external: false }
		});
	});

	it('drops a group that leads nowhere, and an item left with nothing', async () => {
		mockedFetchPublic.mockResolvedValueOnce({
			items: [
				{
					label: 'Countries',
					href: null,
					external: false,
					children: [{ label: 'Nowhere', href: null, external: false, children: [] }]
				},
				{ label: 'About', href: '/about', external: false, children: [] }
			],
			cta: null
		});

		const nav = await fetchHeaderNav();
		expect(nav?.items.map((item) => item.label)).toEqual(['About']);
		expect(nav?.cta).toBeNull();
	});

	it('keeps a heading-only group that still carries locations', async () => {
		mockedFetchPublic.mockResolvedValueOnce({
			items: [
				{
					label: 'Countries',
					href: null,
					external: false,
					children: [
						{
							label: 'Spain',
							href: null,
							external: false,
							countrySlug: 'spain',
							flag: null,
							children: [{ label: 'Marbella', href: '/spain/marbella', external: false }]
						}
					]
				}
			],
			cta: null
		});

		const nav = await fetchHeaderNav();
		expect(nav?.items[0].children[0]).toMatchObject({ label: 'Spain', href: null });
		expect(nav?.items[0].children[0].children).toHaveLength(1);
	});

	it('returns null when nothing usable is authored', async () => {
		mockedFetchPublic.mockResolvedValueOnce({ items: [], cta: null });
		expect(await fetchHeaderNav()).toBeNull();
	});
});
