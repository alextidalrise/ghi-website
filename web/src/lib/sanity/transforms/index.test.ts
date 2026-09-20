import { describe, expect, it, vi } from 'vitest';
import { toPublicUnitListing, type RawUnitListing } from './index';

// The unit transform pulls in mediaFilter, which imports the image helpers; stub
// them so these content-focused tests don't need real Sanity image resolution.
vi.mock('../image', () => ({
	getImagePlaceholder: vi.fn(() => null),
	buildPublicImageUrl: vi.fn(() => null)
}));

const about = (text: string) => [
	{
		_type: 'block',
		_key: text,
		style: 'normal',
		markDefs: [],
		children: [{ _type: 'span', _key: `${text}-0`, text, marks: [] }]
	}
];

function baseRaw(overrides: Partial<RawUnitListing> = {}): RawUnitListing {
	return {
		_id: 'unit-1',
		_type: 'unit',
		unitName: 'Villa 12',
		slug: 'villa-12',
		development: {
			_id: 'dev-1',
			title: 'Epic',
			slug: 'epic',
			content: {
				shortDescription: 'Dev short',
				aboutDescription: about('Dev about'),
				featureHighlights: [{ label: 'Dev pool' }]
			}
		},
		...overrides
	};
}

describe('toPublicUnitListing content ladder', () => {
	it('falls back to the development when the unit and type have no content', () => {
		const result = toPublicUnitListing(baseRaw());
		expect(result).not.toBeNull();
		expect(result!.listing.content?.aboutDescription).toEqual(about('Dev about'));
		expect(result!.listing.content?.shortDescription).toBe('Dev short');
		expect(result!.listing.content?.featureHighlights).toEqual([{ label: 'Dev pool' }]);
		// SEO meta description also honours the ladder.
		expect(result!.listing.seo?.metaDescription).toBe('Dev short');
	});

	it('resolves per field: unit about wins while other fields fall through', () => {
		const result = toPublicUnitListing(
			baseRaw({
				content: {
					// Only override the about body; leave short + highlights blank/empty.
					shortDescription: '   ',
					aboutDescription: about('Unit about'),
					featureHighlights: []
				}
			})
		);
		expect(result?.listing.content?.aboutDescription).toEqual(about('Unit about'));
		expect(result?.listing.content?.shortDescription).toBe('Dev short');
		expect(result?.listing.content?.featureHighlights).toEqual([{ label: 'Dev pool' }]);
	});

	it('uses the unit type when the unit is blank, over the development', () => {
		const raw = baseRaw({
			unitType: {
				_id: 'type-1',
				unitTypeName: '2-bed apartment',
				content: { aboutDescription: about('Type about') }
			}
		});
		const result = toPublicUnitListing(raw);
		expect(result?.listing.content?.aboutDescription).toEqual(about('Type about'));
		// short description not set on unit/type → still the development's.
		expect(result?.listing.content?.shortDescription).toBe('Dev short');
	});

	it('returns null content when no level defines any', () => {
		const raw = baseRaw();
		raw.development!.content = null;
		const result = toPublicUnitListing(raw);
		expect(result?.listing.content).toBeNull();
	});
});

describe('toPublicUnitListing seoTitle', () => {
	/* A development whose name matches its community produced "9-A, Natura Village, Natura
	   Village" — the real defect, seen live on every Natura Village unit. */
	it('collapses a development name that repeats the community name', () => {
		const raw = baseRaw({ unitName: '9-A' });
		raw.development!.title = 'Natura Village';
		raw.development!.location = { community: { name: 'Natura Village' } } as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.seoTitle).toBe('9-A, Natura Village');
	});

	it('keeps all three parts when the development and location differ', () => {
		const raw = baseRaw({ unitName: 'Unit 2.2.1B' });
		raw.development!.title = 'Golden Hills';
		raw.development!.location = { community: { name: 'El Paraiso Golf Club' } } as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.seoTitle).toBe('Unit 2.2.1B, Golden Hills, El Paraiso Golf Club');
	});

	it('de-duplicates regardless of case and surrounding whitespace', () => {
		const raw = baseRaw({ unitName: 'C10' });
		raw.development!.title = '  Finca Cortesin  ';
		raw.development!.location = { community: { name: 'finca cortesin' } } as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.seoTitle).toBe('C10, Finca Cortesin');
	});
});

describe('toPublicUnitListing seo metaDescription precedence', () => {
	/* Reading dev.seo.metaDescription first handed every sibling the identical description.
	   The unit's own copy already existed on 536 of 626 units and was being discarded. */
	it("prefers the unit's own shortDescription over the development's SEO blurb", () => {
		const raw = baseRaw({
			content: {
				shortDescription: 'Unit C15 is recorded as sold in the August 2026 schedule.',
				aboutDescription: null,
				featureHighlights: []
			}
		});
		raw.development!.seo = {
			metaDescription: 'Cortijo 1 is a collection of 13 four-bedroom Finca Cortesin villas.'
		} as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.metaDescription).toBe(
			'Unit C15 is recorded as sold in the August 2026 schedule.'
		);
	});

	it("falls back to the unit type's copy before the development's SEO blurb", () => {
		const raw = baseRaw({
			unitType: {
				_id: 'type-1',
				unitTypeName: 'Cortijo Type 1',
				content: { shortDescription: 'A four-bedroom Cortijo Type 1 villa.' }
			} as never
		});
		raw.development!.seo = { metaDescription: 'Development blurb.' } as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.metaDescription).toBe('A four-bedroom Cortijo Type 1 villa.');
	});

	/* With no unit- or type-level copy, the development's purpose-written SEO description is a
	   better fallback than its body copy — so it must still outrank the content ladder. */
	it("uses the development's SEO blurb when neither the unit nor its type has copy", () => {
		const raw = baseRaw();
		raw.development!.seo = { metaDescription: 'Development blurb.' } as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.metaDescription).toBe('Development blurb.');
	});

	it('ignores whitespace-only unit copy and falls through', () => {
		const raw = baseRaw({
			content: { shortDescription: '   ', aboutDescription: null, featureHighlights: [] }
		});
		raw.development!.seo = { metaDescription: 'Development blurb.' } as never;

		const result = toPublicUnitListing(raw);

		expect(result?.listing.seo?.metaDescription).toBe('Development blurb.');
	});
});
