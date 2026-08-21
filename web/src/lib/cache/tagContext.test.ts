import { describe, expect, it } from 'vitest';
import { addCacheTags, collectDocTags, runWithCacheTags } from './tagContext';

describe('tagContext', () => {
	it('collects tags added within a run', () => {
		const store = { tags: new Set<string>() };
		runWithCacheTags(store, () => {
			addCacheTags('nav', 'home');
			addCacheTags('nav'); // dedup
		});
		expect([...store.tags].sort()).toEqual(['home', 'nav']);
	});

	it('is a no-op outside a run', () => {
		// Must not throw when there is no ambient store (unit tests, scripts).
		expect(() => addCacheTags('nav')).not.toThrow();
	});

	it('adds a doc tag for every document _id in a result', () => {
		const store = { tags: new Set<string>() };
		const result = {
			_id: 'ghi00369',
			_type: 'propertyListing',
			cards: [{ _id: 'dev-1' }, { _id: 'unit-2' }],
			nested: { deep: { _id: 'author-3' } }
		};
		runWithCacheTags(store, () => collectDocTags(result));
		expect([...store.tags].sort()).toEqual([
			'doc:author-3',
			'doc:dev-1',
			'doc:ghi00369',
			'doc:unit-2'
		]);
	});

	it('ignores asset ids and unresolved references', () => {
		const store = { tags: new Set<string>() };
		const result = {
			_id: 'ghi00369',
			hero: { _type: 'image', asset: { _ref: 'image-abc-100x100-jpg', _type: 'reference' } },
			location: { _ref: 'places-country-uae', _type: 'reference' }
		};
		runWithCacheTags(store, () => collectDocTags(result));
		// Only the resolved document; not the image asset, not the raw _ref.
		expect([...store.tags]).toEqual(['doc:ghi00369']);
	});
});
