import { describe, expect, it, vi } from 'vitest';
import type { MediaAssetInput } from './mediaFilter';
import type { RawDevelopmentCard } from './similarListingCard';

vi.mock('../image', () => ({
	getImagePlaceholder: vi.fn(() => null),
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset ? 'https://cdn.example/override.jpg' : null
	),
	buildImageSrcset: vi.fn(() => 'https://cdn.example/override.jpg 800w')
}));

const {
	toInsightDevelopmentCard,
	toInsightDevelopmentGroups,
	formatCompletionLabel
} = await import('./insightDevelopmentCard');

type ItemRaw = Parameters<typeof toInsightDevelopmentCard>[0];

const devRow = (over: Partial<RawDevelopmentCard> = {}): RawDevelopmentCard => ({
	_id: 'ghi00134-zestia',
	listingKind: 'development',
	title: 'Zestia',
	slug: 'zestia-vilamoura',
	developmentDisplayMode: 'units',
	developmentStatus: 'off_plan',
	countrySlug: 'portugal',
	locationSlug: 'vilamoura',
	communitySlug: 'vilamoura',
	isCatchAll: false,
	location: {
		country: { name: 'Portugal', slug: 'portugal' },
		location: { name: 'Vilamoura', slug: 'vilamoura' },
		community: { _id: 'c1', name: 'Vilamoura', slug: 'vilamoura', isCatchAll: false },
		addressDisplay: null
	} as unknown as RawDevelopmentCard['location'],
	pricing: { priceFrom: 560000, currency: 'EUR', priceConfirmed: true } as RawDevelopmentCard['pricing'],
	...over
});

const item = (over: Partial<NonNullable<ItemRaw>> = {}): ItemRaw => ({
	development: devRow(),
	completionDate: '2028-01-01',
	...over
});

describe('formatCompletionLabel', () => {
	it('shows quarter and year for a mid-year date', () => {
		expect(formatCompletionLabel('off_plan', '2028-07-01')).toBe('Estimated completion: Q3 2028');
		expect(formatCompletionLabel('under_construction', '2027-10-03')).toBe(
			'Estimated completion: Q4 2027'
		);
	});

	it('shows year only for a January-1 placeholder date', () => {
		expect(formatCompletionLabel('off_plan', '2028-01-01')).toBe('Estimated completion: 2028');
	});

	it('shows nothing when already available or when no date exists', () => {
		expect(formatCompletionLabel('completed', '2028-07-01')).toBeNull();
		expect(formatCompletionLabel('off_plan', null)).toBeNull();
		expect(formatCompletionLabel('off_plan', 'not-a-date')).toBeNull();
	});
});

describe('toInsightDevelopmentCard', () => {
	it('builds the full canonical route including the community segment', () => {
		const card = toInsightDevelopmentCard(item());
		expect(card).not.toBeNull();
		// Fixes v15's hand-coded hrefs, which omitted the community segment.
		expect(card!.href).toBe('/portugal/vilamoura/vilamoura/zestia-vilamoura');
	});

	it('maps controlled status to a chip label and derives completion', () => {
		expect(toInsightDevelopmentCard(item())!.statusLabel).toBe('Off plan');
		expect(
			toInsightDevelopmentCard(item({ development: devRow({ developmentStatus: 'completed' }), completionDate: null }))!
				.statusLabel
		).toBe('Available now');
		expect(toInsightDevelopmentCard(item())!.completionLabel).toBe('Estimated completion: 2028');
	});

	it('emits no chip for an unknown status (degrades honestly)', () => {
		const card = toInsightDevelopmentCard(item({ development: devRow({ developmentStatus: 'unknown' }) }));
		expect(card!.statusLabel).toBeNull();
	});

	it('prefers the article image override and its alt', () => {
		const card = toInsightDevelopmentCard(
			item({
				imageOverride: { asset: { asset: { _ref: 'x' } }, altText: 'Article aerial' } as unknown as MediaAssetInput
			})
		);
		expect(card!.image).toBe('https://cdn.example/override.jpg');
		expect(card!.alt).toBe('Article aerial');
	});

	it('groups by location by default and honours a group label override', () => {
		expect(toInsightDevelopmentCard(item())!.groupLabel).toBe('Vilamoura');
		expect(toInsightDevelopmentCard(item({ groupLabelOverride: 'The Golden Triangle' }))!.groupLabel).toBe(
			'The Golden Triangle'
		);
	});

	it('fails closed when the development ref is unpublished (null) or lacks a title', () => {
		expect(toInsightDevelopmentCard({ development: null })).toBeNull();
		expect(toInsightDevelopmentCard(item({ development: devRow({ title: '  ' }) }))).toBeNull();
	});
});

describe('toInsightDevelopmentGroups', () => {
	it('groups cards by destination, preserving first-seen order', () => {
		const monteRei = devRow({
			_id: 'm',
			title: 'Monte Rei',
			slug: 'monte-rei-algarve',
			locationSlug: 'monte-rei',
			communitySlug: 'monte-rei',
			location: {
				country: { name: 'Portugal', slug: 'portugal' },
				location: { name: 'Monte Rei', slug: 'monte-rei' },
				community: { _id: 'c2', name: 'Monte Rei', slug: 'monte-rei', isCatchAll: false },
				addressDisplay: null
			} as unknown as RawDevelopmentCard['location']
		});
		const groups = toInsightDevelopmentGroups([
			item({ development: monteRei }),
			item(),
			item({ development: devRow({ _id: 'z2', title: 'Terracota', slug: 'terracota-vilamoura' }) })
		]);
		expect(groups.map((g) => g.label)).toEqual(['Monte Rei', 'Vilamoura']);
		expect(groups[1].cards.map((c) => c.title)).toEqual(['Zestia', 'Terracota']);
	});
});
