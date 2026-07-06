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
			developmentName: 'Epic',
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
