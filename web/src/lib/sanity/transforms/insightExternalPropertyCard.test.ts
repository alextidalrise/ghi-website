import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MediaAssetInput } from './mediaFilter';

// The image builders are exercised elsewhere; here we stub them so the transform can be tested for
// its validation, ordering and safety behaviour without a live Sanity image pipeline.
vi.mock('../image', () => ({
	getImagePlaceholder: vi.fn(() => 'data:image/png;base64,lqip'),
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset?.asset ? 'https://cdn.example/card.jpg' : null
	),
	buildImageSrcset: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset?.asset ? 'https://cdn.example/card.jpg 800w' : ''
	)
}));

const { toInsightExternalPropertyCard, toInsightExternalPropertyCards } = await import(
	'./insightExternalPropertyCard'
);
const { albanyExternalPropertyGrid } = await import(
	'$lib/insights/fixtures/albanyExternalProperties'
);

type Raw = Parameters<typeof toInsightExternalPropertyCard>[0];

const validImage = (): MediaAssetInput =>
	({ asset: { asset: { _ref: 'image-x' } }, altText: 'A sunlit villa terrace' }) as MediaAssetInput;

const card = (over: Partial<NonNullable<Raw>> = {}): Raw => ({
	_key: 'k1',
	name: 'Villa Test',
	location: 'Marbella, Spain',
	guests: 8,
	bedrooms: 4,
	fromPrice: '€1,200 per night',
	description: 'A bright villa with a private pool a short walk from the beach.',
	features: ['Private pool', 'Sea views'],
	image: validImage(),
	linkLabel: 'View on Albany Global Property',
	linkHref: 'https://albany-global.com/properties/villa-test/',
	...over
});

afterEach(() => vi.restoreAllMocks());

describe('toInsightExternalPropertyCard', () => {
	it('resolves a complete card with its article-owned facts and image', () => {
		const resolved = toInsightExternalPropertyCard(card())!;
		expect(resolved).not.toBeNull();
		expect(resolved.name).toBe('Villa Test');
		expect(resolved.location).toBe('Marbella, Spain');
		expect(resolved.guests).toBe(8);
		expect(resolved.bedrooms).toBe(4);
		expect(resolved.fromPrice).toBe('€1,200 per night');
		expect(resolved.image).toBe('https://cdn.example/card.jpg');
		expect(resolved.srcset).toBe('https://cdn.example/card.jpg 800w');
		expect(resolved.alt).toBe('A sunlit villa terrace');
		expect(resolved.lqip).toBe('data:image/png;base64,lqip');
	});

	it('keeps fromPrice as an opaque display string (never parsed as a number)', () => {
		const resolved = toInsightExternalPropertyCard(card({ fromPrice: '€2,250 per night' }))!;
		expect(resolved.fromPrice).toBe('€2,250 per night');
	});

	it('caps features at three and drops blank entries, preserving order', () => {
		const resolved = toInsightExternalPropertyCard(
			card({ features: ['One', '  ', 'Two', 'Three', 'Four'] })
		)!;
		expect(resolved.features).toEqual(['One', 'Two', 'Three']);
	});

	it('drops a card missing required identity or facts', () => {
		expect(toInsightExternalPropertyCard(card({ name: '  ' }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ location: null }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ fromPrice: '' }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ description: null }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ linkLabel: '' }))).toBeNull();
	});

	it('rejects a non-positive-integer guests or bedrooms rather than rendering 0 or a float', () => {
		expect(toInsightExternalPropertyCard(card({ guests: 0 }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ guests: -3 }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ bedrooms: 2.5 }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ bedrooms: null }))).toBeNull();
	});

	it('drops a card whose image is missing, blocked, or has no alt text', () => {
		expect(toInsightExternalPropertyCard(card({ image: null }))).toBeNull();
		// No uploaded asset ⇒ fails the public media gate.
		expect(
			toInsightExternalPropertyCard(card({ image: { altText: 'x' } as MediaAssetInput }))
		).toBeNull();
		// Uploaded asset but no alt text.
		expect(
			toInsightExternalPropertyCard(
				card({ image: { asset: { asset: { _ref: 'y' } } } as MediaAssetInput })
			)
		).toBeNull();
	});

	it('rejects any link that is not an absolute HTTPS URL', () => {
		expect(toInsightExternalPropertyCard(card({ linkHref: 'http://albany-global.com/x' }))).toBeNull();
		expect(toInsightExternalPropertyCard(card({ linkHref: '/relative/path' }))).toBeNull();
		expect(
			toInsightExternalPropertyCard(card({ linkHref: 'javascript:alert(1)' }))
		).toBeNull();
		expect(toInsightExternalPropertyCard(card({ linkHref: null }))).toBeNull();
	});
});

describe('toInsightExternalPropertyCards', () => {
	it('preserves editor order and never reorders or randomises cards', () => {
		const cards = toInsightExternalPropertyCards([
			card({ _key: 'a', name: 'Alpha' }),
			card({ _key: 'b', name: 'Bravo' }),
			card({ _key: 'c', name: 'Charlie' })
		]);
		expect(cards.map((c) => c.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
	});

	it('omits one invalid card, keeps the rest coherent, and warns about the omission', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const cards = toInsightExternalPropertyCards([
			card({ _key: 'a', name: 'Alpha' }),
			card({ _key: 'b', name: 'Bravo', linkHref: 'http://insecure.example' }),
			card({ _key: 'c', name: 'Charlie' })
		]);
		expect(cards.map((c) => c.name)).toEqual(['Alpha', 'Charlie']);
		expect(warn).toHaveBeenCalledTimes(1);
		expect(warn.mock.calls[0][0]).toContain('Bravo');
	});

	it('returns an empty list for null/undefined items without throwing', () => {
		expect(toInsightExternalPropertyCards(null)).toEqual([]);
		expect(toInsightExternalPropertyCards(undefined)).toEqual([]);
	});
});

describe('Albany four-card fixture', () => {
	it('renders all four cards in the locked editorial order', () => {
		const cards = toInsightExternalPropertyCards(albanyExternalPropertyGrid.items);
		expect(cards.map((c) => c.name)).toEqual([
			'Herdade do Sol',
			'Villa Margarita',
			'Villa Golfe Norte',
			'Ocaso Penthouse'
		]);
	});

	it('carries the correct partner facts and from-prices', () => {
		const cards = toInsightExternalPropertyCards(albanyExternalPropertyGrid.items);
		expect(cards.map((c) => [c.location, c.guests, c.bedrooms, c.fromPrice])).toEqual([
			['Comporta, Portugal', 12, 6, '€2,250 per night'],
			['Marbella, Spain', 10, 5, '€2,200 per night'],
			['Algarve, Portugal', 10, 5, '€1,500 per night'],
			['Marbella, Spain', 6, 3, '€300 per night']
		]);
	});

	it('keeps every CTA an absolute HTTPS Albany link with the locked label', () => {
		const cards = toInsightExternalPropertyCards(albanyExternalPropertyGrid.items);
		for (const c of cards) {
			expect(c.linkLabel).toBe('View on Albany Global Property');
			expect(c.linkHref).toMatch(/^https:\/\/albany-global\.com\/properties\//);
		}
		// Villa Margarita intentionally still points at the villa-serena slug.
		expect(cards[1].linkHref).toBe('https://albany-global.com/properties/villa-serena/');
	});

	it('exposes a grid-level price volatility note', () => {
		expect(albanyExternalPropertyGrid.priceNote).toBe(
			'Prices and availability are provided by Albany Global Property and may change.'
		);
	});
});
