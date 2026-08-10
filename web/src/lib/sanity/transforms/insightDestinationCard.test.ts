import { describe, expect, it, vi } from 'vitest';
import type { MediaAssetInput } from './mediaFilter';
import type { InsightDestinationCardRaw } from '$lib/insights/types';

// The transform is pure apart from the image-URL builders; stub those so a resolvable asset yields
// a deterministic URL and a null asset yields null (mirroring the real builders' contract).
vi.mock('../image', () => ({
	getImagePlaceholder: vi.fn(() => 'data:image/lqip'),
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset ? 'https://cdn.example/img.jpg' : null
	),
	buildImageSrcset: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset ? 'https://cdn.example/img.jpg 800w' : ''
	)
}));

const { toInsightDestinationCard, toInsightDestinationCards } = await import('./insightDestinationCard');

const asset = (altText?: string): MediaAssetInput =>
	({ asset: { asset: { _ref: 'image-abc' } }, altText }) as unknown as MediaAssetInput;

const baseRaw = (over: Partial<InsightDestinationCardRaw> = {}): InsightDestinationCardRaw => ({
	body: 'A well-connected Algarve destination.',
	location: {
		_id: 'loc-1',
		name: 'Vilamoura',
		slug: 'vilamoura',
		type: 'location',
		countrySlug: 'portugal',
		heroImage: asset('Vilamoura marina')
	},
	...over
});

describe('toInsightDestinationCard', () => {
	it('builds the canonical location hub href and pulls identity from the location', () => {
		const card = toInsightDestinationCard(baseRaw());
		expect(card).not.toBeNull();
		expect(card!.name).toBe('Vilamoura');
		expect(card!.href).toBe('/portugal/vilamoura');
		expect(card!.alt).toBe('Vilamoura marina');
		expect(card!.actionLabel).toBe('See Vilamoura properties');
	});

	it('prefers an explicit CTA href override over the canonical hub URL', () => {
		const card = toInsightDestinationCard(baseRaw({ actionHrefOverride: '/portugal/vilamoura/special' }));
		expect(card!.href).toBe('/portugal/vilamoura/special');
	});

	it('prefers the article image override and its alt over the location hero', () => {
		const card = toInsightDestinationCard(
			baseRaw({ imageOverride: asset('Article-only aerial') })
		);
		expect(card!.alt).toBe('Article-only aerial');
	});

	it('uses an authored CTA label when present', () => {
		const card = toInsightDestinationCard(baseRaw({ actionLabel: 'Explore Vilamoura' }));
		expect(card!.actionLabel).toBe('Explore Vilamoura');
	});

	it('fails closed when the hub href cannot be resolved (missing country slug)', () => {
		const raw = baseRaw();
		raw.location!.countrySlug = null;
		expect(toInsightDestinationCard(raw)).toBeNull();
	});

	it('fails closed when there is no image at all', () => {
		const raw = baseRaw({ imageOverride: null });
		raw.location!.heroImage = null;
		expect(toInsightDestinationCard(raw)).toBeNull();
	});

	it('fails closed when name or body is missing', () => {
		expect(toInsightDestinationCard(baseRaw({ body: '   ' }))).toBeNull();
		const noName = baseRaw();
		noName.location!.name = null;
		expect(toInsightDestinationCard(noName)).toBeNull();
	});
});

describe('toInsightDestinationCards', () => {
	it('drops cards that fail to resolve and keeps the rest in order', () => {
		const broken = baseRaw();
		broken.location!.name = null;
		const cards = toInsightDestinationCards([baseRaw(), null, broken, baseRaw({ actionLabel: 'B' })]);
		expect(cards).toHaveLength(2);
		expect(cards[1].actionLabel).toBe('B');
	});
});
