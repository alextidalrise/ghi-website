import { describe, expect, it, vi } from 'vitest';
import type { MediaAssetInput } from './mediaFilter';
import type { RawPropertyCard } from './propertyCard';

vi.mock('../image', () => ({
	getImagePlaceholder: vi.fn(() => null),
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset ? 'https://cdn.example/override.jpg' : null
	),
	buildImageSrcset: vi.fn(() => 'https://cdn.example/override.jpg 800w')
}));

const { toInsightListingCard, toInsightListingGroups } = await import('./insightListingCard');

type ItemRaw = Parameters<typeof toInsightListingCard>[0];

const listingRow = (over: Partial<RawPropertyCard> = {}): RawPropertyCard => ({
	_id: 'ghi00438-santa-rosalia',
	ghiListingId: 'GHI00438',
	title: 'Lakeside villa, Santa Rosalía',
	slug: 'lakeside-villa-santa-rosalia',
	listingKind: 'property',
	propertyType: 'villa',
	transactionType: 'sale',
	countrySlug: 'spain',
	locationSlug: 'murcia',
	communitySlug: 'santa-rosalia',
	isCatchAll: false,
	location: {
		country: { name: 'Spain', slug: 'spain' },
		location: { name: 'Murcia', slug: 'murcia' },
		community: { _id: 'c1', name: 'Santa Rosalía', slug: 'santa-rosalia', isCatchAll: false },
		addressDisplay: null
	} as unknown as RawPropertyCard['location'],
	pricing: { price: 445000, priceDisplay: '445000', currency: 'EUR' } as RawPropertyCard['pricing'],
	specs: { bedrooms: 3, bathrooms: 2 } as RawPropertyCard['specs'],
	media: null as unknown as RawPropertyCard['media'],
	...over
});

const item = (over: Partial<NonNullable<ItemRaw>> = {}): ItemRaw => ({
	listing: listingRow(),
	...over
});

describe('toInsightListingCard', () => {
	it('builds the full canonical route including the community segment', () => {
		const card = toInsightListingCard(item());
		expect(card).not.toBeNull();
		expect(card!.href).toBe('/spain/murcia/santa-rosalia/lakeside-villa-santa-rosalia');
	});

	it('formats the live price and a beds · baths specs line', () => {
		const card = toInsightListingCard(item())!;
		expect(card.price).toBe('€445,000');
		expect(card.specsLabel).toBe('3 bed · 2 bath');
	});

	it('shows POA when the listing is priced on application', () => {
		const card = toInsightListingCard(
			item({ listing: listingRow({ pricing: { priceDisplay: 'POA' } as RawPropertyCard['pricing'] }) })
		)!;
		expect(card.price).toBe('POA');
	});

	it('reads the resort as the location line, and the country beneath it', () => {
		const card = toInsightListingCard(item())!;
		expect(card.locationLabel).toBe('Santa Rosalía');
		expect(card.countryLabel).toBe('Spain');
	});

	it('falls back to the wider area when the community just echoes the title', () => {
		// Some Murcia/Alicante listings borrow the resort name as their title; the community must not
		// render twice, so the location line drops to the area (Murcia) instead of repeating it.
		const echo = listingRow({
			title: 'Santa Rosalía',
			location: {
				country: { name: 'Spain', slug: 'spain' },
				location: { name: 'Murcia', slug: 'murcia' },
				community: { _id: 'c1', name: 'Santa Rosalía', slug: 'santa-rosalia', isCatchAll: false },
				addressDisplay: null
			} as unknown as RawPropertyCard['location']
		});
		expect(toInsightListingCard(item({ listing: echo }))!.locationLabel).toBe('Murcia');
	});

	it('prefers the article image override and its alt', () => {
		const card = toInsightListingCard(
			item({
				imageOverride: {
					asset: { asset: { _ref: 'x' } },
					altText: 'Article terrace'
				} as unknown as MediaAssetInput
			})
		)!;
		expect(card.image).toBe('https://cdn.example/override.jpg');
		expect(card.alt).toBe('Article terrace');
	});

	it('groups by the resort by default and honours a group label override', () => {
		expect(toInsightListingCard(item())!.groupLabel).toBe('Santa Rosalía');
		expect(toInsightListingCard(item({ groupLabelOverride: 'Costa Cálida' }))!.groupLabel).toBe(
			'Costa Cálida'
		);
	});

	it('fails closed when the listing ref is unpublished (null) or lacks a title', () => {
		expect(toInsightListingCard({ listing: null })).toBeNull();
		expect(toInsightListingCard(item({ listing: listingRow({ title: '  ' }) }))).toBeNull();
	});
});

describe('toInsightListingGroups', () => {
	it('groups cards by resort, preserving first-seen order', () => {
		const elValle = listingRow({
			_id: 'ghi00260-el-valle',
			title: 'Golf apartment, El Valle',
			slug: 'golf-apartment-el-valle',
			communitySlug: 'el-valle',
			location: {
				country: { name: 'Spain', slug: 'spain' },
				location: { name: 'Murcia', slug: 'murcia' },
				community: { _id: 'c2', name: 'El Valle Golf Resort', slug: 'el-valle', isCatchAll: false },
				addressDisplay: null
			} as unknown as RawPropertyCard['location']
		});
		const groups = toInsightListingGroups([
			item({ listing: elValle }),
			item(),
			item({
				listing: listingRow({
					_id: 'ghi00344-santa-rosalia-2',
					title: 'Townhouse, Santa Rosalía',
					slug: 'townhouse-santa-rosalia'
				})
			})
		]);
		expect(groups.map((g) => g.label)).toEqual(['El Valle Golf Resort', 'Santa Rosalía']);
		expect(groups[1].cards.map((c) => c.title)).toEqual([
			'Lakeside villa, Santa Rosalía',
			'Townhouse, Santa Rosalía'
		]);
	});
});
