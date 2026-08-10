import { describe, expect, it, vi } from 'vitest';
import type { MediaAssetInput } from './mediaFilter';

vi.mock('../image', () => ({
	buildPublicImageUrl: vi.fn((asset: MediaAssetInput | null | undefined) =>
		asset ? 'https://cdn.example/logo.png' : null
	),
	buildImageSrcset: vi.fn(() => 'https://cdn.example/logo.png 320w')
}));

const { toInsightPartnerLogoCard, toInsightPartnerLogoCards } = await import('./insightPartnerLogoCard');

type ItemRaw = Parameters<typeof toInsightPartnerLogoCard>[0];
type PartnerRaw = NonNullable<NonNullable<ItemRaw>['partner']>;

const partner = (over: Partial<PartnerRaw> = {}): PartnerRaw => ({
	_id: 'p-currency',
	name: 'CurrencyCo',
	slug: 'currencyco',
	category: 'Currency',
	logo: { asset: { asset: { _ref: 'l' } }, altText: 'CurrencyCo logo' } as unknown as MediaAssetInput,
	...over
});

const item = (over: Partial<NonNullable<ItemRaw>> = {}): ItemRaw => ({ partner: partner(), ...over });

describe('toInsightPartnerLogoCard', () => {
	it('links to the vetted-partner index anchor, never the partner’s own destination', () => {
		const card = toInsightPartnerLogoCard(item());
		expect(card).not.toBeNull();
		expect(card!.href).toBe('/partners#partner-currencyco');
		// The transform can only project what the allowlist gave it — assert no referral field leaks.
		expect(Object.keys(card!)).not.toContain('referralUrl');
	});

	it('defaults the service label to the partner category and honours an override', () => {
		expect(toInsightPartnerLogoCard(item())!.serviceLabel).toBe('Currency');
		expect(toInsightPartnerLogoCard(item({ serviceLabel: 'FX & Payments' }))!.serviceLabel).toBe(
			'FX & Payments'
		);
	});

	it('fails closed on a null partner, missing name/slug, or no logo (a logo wall needs a logo)', () => {
		expect(toInsightPartnerLogoCard({ partner: null })).toBeNull();
		expect(toInsightPartnerLogoCard(item({ partner: partner({ name: '  ' }) }))).toBeNull();
		expect(toInsightPartnerLogoCard(item({ partner: partner({ slug: null }) }))).toBeNull();
		expect(toInsightPartnerLogoCard(item({ partner: partner({ logo: null }) }))).toBeNull();
	});
});

describe('toInsightPartnerLogoCards', () => {
	it('maps items and drops the ones that fail closed, preserving order', () => {
		const cards = toInsightPartnerLogoCards([
			item(),
			item({ partner: partner({ logo: null }) }),
			item({ partner: partner({ _id: 'p-2', name: 'LegalCo', slug: 'legalco' }) })
		]);
		expect(cards.map((c) => c._id)).toEqual(['p-currency', 'p-2']);
	});
});
