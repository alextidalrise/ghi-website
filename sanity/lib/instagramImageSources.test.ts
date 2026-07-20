import { describe, expect, it } from 'vitest';
import {
	countImages,
	hasUploadedAsset,
	resolveImageSources,
	type MediaAssetLike
} from './instagramImageSources';

function img(key: string, altText = ''): MediaAssetLike {
	return {
		_key: key,
		_type: 'mediaAssetMetadata',
		altText,
		asset: { _type: 'image', asset: { _ref: `image-${key}-2000x1500-jpg`, _type: 'reference' } }
	};
}

/** A gallery slot an editor added but never uploaded to. */
const emptySlot: MediaAssetLike = { _key: 'empty', _type: 'mediaAssetMetadata' };

describe('hasUploadedAsset', () => {
	it('accepts an entry with an asset reference', () => {
		expect(hasUploadedAsset(img('a'))).toBe(true);
	});

	it('rejects an entry with no uploaded file', () => {
		expect(hasUploadedAsset(emptySlot)).toBe(false);
	});

	it('rejects null and non-objects', () => {
		expect(hasUploadedAsset(null)).toBe(false);
		expect(hasUploadedAsset('nope')).toBe(false);
	});
});

describe('resolveImageSources — propertyListing', () => {
	it('returns the media gallery as a single group', () => {
		const groups = resolveImageSources({
			_type: 'propertyListing',
			media: { gallery: [img('a'), img('b')] }
		});

		expect(groups).toHaveLength(1);
		expect(groups[0].label).toBe('This listing');
		expect(groups[0].path).toBe('media.gallery');
		expect(countImages(groups)).toBe(2);
	});

	it('drops entries with no uploaded asset', () => {
		const groups = resolveImageSources({
			_type: 'propertyListing',
			media: { gallery: [img('a'), emptySlot] }
		});

		expect(countImages(groups)).toBe(1);
	});

	it('returns no groups when the gallery is empty', () => {
		expect(resolveImageSources({ _type: 'propertyListing', media: { gallery: [] } })).toEqual([]);
	});
});

describe('resolveImageSources — development', () => {
	it('returns shared gallery, media gallery and each named group in order', () => {
		const groups = resolveImageSources({
			_type: 'development',
			sharedGallery: [img('s1')],
			media: {
				gallery: [img('g1'), img('g2')],
				galleryGroups: [
					{ title: 'Communal areas', images: [img('c1')] },
					{ title: 'Empty group', images: [emptySlot] }
				]
			}
		});

		expect(groups.map((entry) => entry.label)).toEqual([
			'shared gallery',
			'gallery',
			'Communal areas'
		]);
		expect(groups[2].path).toBe('media.galleryGroups[0].images');
		expect(countImages(groups)).toBe(4);
	});
});

describe('resolveImageSources — unitType', () => {
	it('unions its own gallery with the parent development', () => {
		const groups = resolveImageSources(
			{ _type: 'unitType', gallery: [img('t1')] },
			{ development: { title: 'Epic Golden Mile', sharedGallery: [img('s1')] } }
		);

		expect(groups.map((entry) => entry.label)).toEqual([
			'This unit type',
			'Development (Epic Golden Mile) — shared gallery'
		]);
		expect(groups[1].path).toBe('parentDevelopment.sharedGallery');
	});
});

describe('resolveImageSources — unit', () => {
	it('returns all three tiers, unit first', () => {
		const groups = resolveImageSources(
			{ _type: 'unit', unitGallery: [img('u1')] },
			{
				unitType: { unitTypeName: '2-bed apartment', gallery: [img('t1'), img('t2')] },
				development: { title: 'Epic Golden Mile', sharedGallery: [img('s1')] }
			}
		);

		expect(groups.map((entry) => entry.label)).toEqual([
			'This unit',
			'Unit type (2-bed apartment)',
			'Development (Epic Golden Mile) — shared gallery'
		]);
		expect(countImages(groups)).toBe(4);
	});

	it('still offers inherited images when the unit has none of its own', () => {
		// The common case: unitGallery is an override and is normally left empty.
		const groups = resolveImageSources(
			{ _type: 'unit' },
			{
				unitType: { unitTypeName: '2-bed apartment', gallery: [img('t1')] },
				development: { title: 'Epic Golden Mile', media: { gallery: [img('g1')] } }
			}
		);

		expect(countImages(groups)).toBe(2);
		expect(groups[0].label).toBe('Unit type (2-bed apartment)');
	});

	it('falls back to generic labels when parent titles are missing', () => {
		const groups = resolveImageSources(
			{ _type: 'unit' },
			{ unitType: { gallery: [img('t1')] }, development: { sharedGallery: [img('s1')] } }
		);

		expect(groups.map((entry) => entry.label)).toEqual([
			'Unit type',
			'Development — shared gallery'
		]);
	});

	it('returns nothing when no parents are loaded yet', () => {
		expect(resolveImageSources({ _type: 'unit' }, {})).toEqual([]);
	});
});

describe('resolveImageSources — other', () => {
	it('returns nothing for an unrelated document type', () => {
		expect(resolveImageSources({ _type: 'insight', media: { gallery: [img('a')] } })).toEqual([]);
	});

	it('returns nothing for a missing document', () => {
		expect(resolveImageSources(null)).toEqual([]);
	});
});
